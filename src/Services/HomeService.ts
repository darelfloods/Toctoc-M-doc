// src/Services/HomeService.ts
import { joinUrl } from '@/utils/url'
import { fetchApi } from '@/utils/api'
import { normalizeProductImage } from '@/utils/imageUtils'

export class HomeService {
  private searchController?: AbortController;
  private searchCache: Map<string, any[]> = new Map();

  constructor() {
    // Nothing to init now; paths are built relatively and fetchApi handles bases
  }

  // Cancel any ongoing product search
  public cancelSearch() {
    try {
      if (this.searchController) {
        this.searchController.abort();
      }
    } catch { }
    this.searchController = undefined;
  }

  // Vider le cache de recherche pour forcer le rafraîchissement des données (y compris les images)
  public clearSearchCache() {
    this.searchCache.clear();
  }

  /**
   * Call n8n webhook to get alternative suggestions text when no product is available in region.
   * Returns a plain text string with the mandatory prefix and markdown asterisks removed.
   */
  async askN8nAlternatives(input: { productName?: string; province?: string; cip?: string | number; rawQuery?: string }): Promise<string | null> {
    const medicamentName = input.productName || 'médicament recherché'

    console.log(`[HomeService] 🔍 Asking n8n alternatives for: ${medicamentName} in province: ${input.province || 'unknown'}`)

    // Webhook URL n8n - utiliser le proxy Vercel en prod et le proxy Vite en dev pour contourner CORS
    const webhookUrl = '/n8n-webhook/webhook/659daf74-ca15-40e2-a52c-54054db41de6'

    // Timeout configuration (60s pour laisser le temps à l'IA de répondre + cold start)
    const timeoutMs = 60000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      // Format du message exact comme demandé
      const message = `quel est l'alternatif de ${medicamentName}`

      console.log('[HomeService] 📤 Sending message to webhook:', message)

      // Essayer plusieurs formats de payload au cas où n8n attend un format spécifique
      const payloads = [
        // Format correct pour le workflow n8n alternatives (body.prompt)
        { body: { prompt: message } },
        // Formats les plus courants pour n8n
        { prompt: message },
        { message: message },
        { text: message },
        { input: message },
        { query: message },
        { content: message },
        // Formats spécifiques n8n alternatifs
        { body: { message: message } },
        { data: message },
        // Format simple string
        message,
        // Format avec métadonnées
        {
          prompt: message,
          message: message,
          medicament: medicamentName,
          type: 'alternative_request'
        }
      ]

      let response: Response | null = null

      // Essayer chaque format jusqu'à ce qu'un fonctionne
      for (let i = 0; i < payloads.length; i++) {
        try {
          console.log(`[HomeService] 📤 Trying payload format ${i + 1}:`, payloads[i])

          const testResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloads[i]),
            signal: controller.signal
          })

          if (testResponse.ok) {
            // Vérifier si la réponse contient du contenu valide
            const testText = await testResponse.clone().text()
            console.log(`[HomeService] 📥 Response ${i + 1} preview:`, testText.substring(0, 200))
            console.log(`[HomeService] 📊 Response ${i + 1} full length:`, testText.length, 'chars')
            console.log(`[HomeService] 🔍 Response ${i + 1} content-type:`, testResponse.headers.get('content-type'))

            // Critères plus intelligents pour détecter une vraie réponse
            const hasContent = testText && testText.trim()
            const isNotEmpty = testText !== '{}' && testText !== 'null' && testText !== ''
            const isNotError = !testText.includes('No prompt specified') && !testText.includes('error')
            const hasMinLength = testText.length > 5 // Une vraie réponse fait au moins quelques caractères

            if (hasContent && isNotEmpty && isNotError && hasMinLength) {
              response = testResponse
              console.log(`[HomeService] ✅ Payload format ${i + 1} worked! Response: "${testText.substring(0, 50)}..."`)
              break
            } else {
              console.log(`[HomeService] ⚠️ Format ${i + 1} response seems empty or invalid`)
            }
          } else {
            console.log(`[HomeService] ❌ Format ${i + 1} returned ${testResponse.status} ${testResponse.statusText}`)
          }
        } catch (e) {
          console.warn(`[HomeService] ⚠️ Payload format ${i + 1} failed:`, e)
        }
      }

      if (!response) {
        console.error('[HomeService] ❌ All POST payload formats failed')
        return null
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`[HomeService] ❌ Webhook returned ${response.status} ${response.statusText}`)
        return null
      }

      const contentType = response.headers?.get('content-type') || ''
      let webhookResponse: string | null = null

      if (contentType.includes('application/json')) {
        try {
          const data = await response.json()
          console.log('[HomeService] 📥 Webhook JSON response:', data)

          // Si la réponse est un tableau, prendre le premier élément
          let responseData = data
          if (Array.isArray(data) && data.length > 0) {
            responseData = data[0]
            console.log('[HomeService] 📦 Response is array, using first item:', responseData)
          }

          // Try multiple response field names
          const responseFields = ['alternative', 'reply', 'text', 'message', 'output', 'content', 'answer', 'result', 'response']
          for (const field of responseFields) {
            const value = (responseData as any)?.[field]
            if (typeof value === 'string' && value.trim()) {
              webhookResponse = value
              console.log(`[HomeService] ✅ Found response in field '${field}':`, value)
              break
            }
          }

          // Check nested structures
          if (!webhookResponse) {
            const nested = (responseData as any)?.data?.alternative || (responseData as any)?.result?.text || (responseData as any)?.choices?.[0]?.message?.content
            if (typeof nested === 'string' && nested.trim()) {
              webhookResponse = nested
            }
          }
        } catch (e) {
          console.warn('[HomeService] ⚠️ Failed to parse JSON response, trying as text:', e)
          webhookResponse = await response.text().catch(() => null)
        }
      } else {
        webhookResponse = await response.text().catch(() => null)
      }

      if (webhookResponse && webhookResponse.trim()) {
        // Clean the response: remove markdown asterisks and extra whitespace
        let cleaned = webhookResponse.replace(/\*\*/g, '').replace(/\*/g, '').trim()

        // Remove common webhook noise
        cleaned = cleaned.replace(/^(response|reply|output):\s*/i, '')

        console.log('[HomeService] ✅ Webhook alternative found:', cleaned)
        return cleaned
      }

      console.log('[HomeService] ❌ No valid response from webhook')

      // Debug: afficher la réponse brute pour diagnostic
      try {
        const debugText = await response.clone().text()
        console.log('[HomeService] 🐛 Raw response for debugging:', debugText)

        // Si la réponse est vide, c'est probablement un problème de configuration n8n
        if (!debugText || debugText.trim() === '' || debugText === '{}') {
          console.warn('[HomeService] 🚨 Webhook returns empty response - n8n workflow needs configuration!')
          console.warn('[HomeService] 📖 See WEBHOOK_N8N_SETUP_GUIDE.md for setup instructions')

          // Fallback temporaire avec message utile
          return `Alternative suggérée : Consultez votre pharmacien pour un équivalent de ${medicamentName}. (Webhook n8n à configurer)`
        }
      } catch (e) {
        console.log('[HomeService] 🐛 Could not read raw response for debugging')
      }

      return null

    } catch (e: any) {
      clearTimeout(timeoutId)

      if (e?.name === 'AbortError') {
        console.warn('[HomeService] ⏰ Webhook timeout after 5s')
      } else {
        console.warn('[HomeService] ❌ Webhook request failed:', e)
      }

      return null
    }
  }

  async getAllProduct(page: number, count: number) {
    try {
      // Utiliser le proxy Vercel en prod et le proxy Vite en dev pour contourner CORS
      const apiUrl = '/epharma-api/public/api/produits'
      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`)

      const json = await res.json()
      const allProducts = Array.isArray(json?.data) ? json.data : []

      const normalized = allProducts.map((p: any) => {
        // Normaliser l'image du produit avec fallback vers placeholder
        const productWithImage = normalizeProductImage(p)
        
        // Construire l'objet final : d'abord les propriétés de base, puis le reste, enfin les images normalisées
        return {
          id: p.id,
          libelle: p.libelle || p.name || p.nom || '',
          cip: p.cip || p.cip_deux || '',
          prix_de_vente: p.prix_de_vente ?? p.price ?? null,
          description: p.description || '',
          prescriptionRequired: p.prescriptionRequired ?? p.prescription_required ?? false,
          ...p, // Toutes les autres propriétés originales
          // Enfin, écraser avec les valeurs normalisées d'image (photo, photoURL, image) pour garantir le fallback
          photo: productWithImage.photo,
          photoURL: productWithImage.photoURL,
          image: productWithImage.image
        }
      })

      const startIndex = (page - 1) * count
      const endIndex = startIndex + count
      return normalized.slice(startIndex, endIndex)

    } catch (e) {
      console.warn('[HomeService] getAllProduct failed:', e)
      return []
    }
  }


  async disponibilite(cip: string | number) {
    const path = joinUrl('api_epg', 'disponibility_product');
    const res = await fetchApi(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        cip: String(cip),
        pharmacy: '', // Champ requis mais non utilisé par le backend (ligne 132 du ProductApi.py)
        name: 'Product', // Champs requis par le schema Pydantic
        price: 0,
        stock: 0
      }
    });
    if (!res.ok) throw new Error('Erreur lors de la vérification de disponibilité');
    return await res.json();
  }

  async searchProducts(term: string) {
    const { ExcelProductService } = await import('./ExcelProductService');
    const key = term.toLowerCase();

    // Note: Le cache est désactivé pour garantir que les nouvelles images sont toujours prises en compte
    // Si vous avez besoin de performance, vous pouvez réactiver le cache mais avec un TTL
    // Retour immédiat si déjà en cache (désactivé temporairement pour garantir les mises à jour)
    // if (this.searchCache.has(key)) {
    //   return this.searchCache.get(key) as any[];
    // }

    // Annuler la recherche précédente si elle est encore en cours
    this.cancelSearch();
    this.searchController = new AbortController();

    try {
      // Rechercher dans le fichier Excel local
      const data = await ExcelProductService.searchProducts(term);

      // Normaliser les images des résultats de recherche avec placeholder si absent
      // Cette normalisation garantit que les nouvelles images sont toujours détectées
      const normalized = (data || []).map((p: any) => {
        return normalizeProductImage(p)
      })

      // Mettre en cache le résultat (optionnel - peut être désactivé pour forcer le rafraîchissement)
      this.searchCache.set(key, Array.isArray(normalized) ? normalized : []);
      return normalized;
    } catch (err: any) {
      // Si la requête est annulée, retourner un tableau vide pour ignorer ce résultat
      if (err?.name === 'AbortError') {
        return [];
      }
      throw err;
    } finally {
      // Nettoyage du controller courant
      this.searchController = undefined;
    }
  }

  /**
   * Ask backend for an alternative product suggestion constrained by province
   * Payload fields are optional to let backend use best available signal.
   * Expected response shape (example): { libelle: string, cip?: string, [k:string]: any } | null
   */
  async alternativeByProvince(payload: { cip?: string | number; province?: string; query?: string }) {
    const url = joinUrl('api_epg', 'alternative_by_province')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cip: payload.cip != null ? String(payload.cip) : undefined,
        province: payload.province,
        query: payload.query
      })
    })
    if (!res.ok) {
      // Non-blocking: just return null so caller can gracefully fallback
      return null
    }
    try {
      const data = await res.json()
      if (!data) return null
      return data
    } catch {
      return null
    }
  }

  // Alias pour répondre à l'appel "produtcs_by_searrch" demandé
  async products_by_searrch(term: string) {
    return this.searchProducts(term);
  }

  // Alias supplémentaire avec l'orthographe exacte demandée (typo incluse)
  async produtcs_by_searrch(term: string) {
    return this.searchProducts(term);
  }
}
