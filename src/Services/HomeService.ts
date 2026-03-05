// src/Services/HomeService.ts
import { joinUrl } from '@/utils/url'
import { fetchApi } from '@/utils/api'
import { normalizeProductImage } from '@/utils/imageUtils'

export class HomeService {
  private searchController?: AbortController;
  private searchCache: Map<string, any[]> = new Map();
  private useDirectUrls: boolean = false; // Fallback si les proxies ne fonctionnent pas

  constructor() {
    // Nothing to init now; paths are built relatively and fetchApi handles bases
  }

  /**
   * Détecte si une réponse est du HTML au lieu de JSON (erreur de proxy)
   */
  private isHtmlResponse(text: string): boolean {
    return text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')
  }

  /**
   * Obtient l'URL correcte pour un endpoint en fonction du mode (proxy ou direct)
   */
  private getApiUrl(proxyPath: string, directUrl: string): string {
    return this.useDirectUrls ? directUrl : proxyPath
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

    // Webhook URL n8n - utiliser le proxy Vercel/Nginx en prod et le proxy Vite en dev pour contourner CORS
    // Fallback automatique vers URL directe si le proxy ne fonctionne pas
    const webhookUrl = this.getApiUrl(
      '/n8n-webhook/webhook/659daf74-ca15-40e2-a52c-54054db41de6',
      'https://n8n-workflows-cktx.onrender.com/webhook/659daf74-ca15-40e2-a52c-54054db41de6'
    )

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

            // Détecter si on reçoit du HTML au lieu de JSON (erreur de proxy)
            if (this.isHtmlResponse(testText)) {
              console.warn('[HomeService] ⚠️ Webhook proxy non configuré, bascule sur URL directe')
              this.useDirectUrls = true
              // Réessayer avec l'URL directe
              return this.askN8nAlternatives(input)
            }

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

  async getAllProduct(page: number, count: number): Promise<any[]> {
    try {
      // Utiliser le proxy Vercel/Nginx en prod et le proxy Vite en dev pour contourner CORS
      // Fallback automatique vers URL directe si le proxy ne fonctionne pas
      const apiUrl = this.getApiUrl(
        '/epharma-api/public/api/produits',
        'https://epharma-panel.srv557357.hstgr.cloud/public/api/produits'
      )

      console.log(`[HomeService] Fetching products from: ${apiUrl}`)
      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`)

      // Vérifier si on reçoit du HTML au lieu de JSON (erreur de proxy)
      const text = await res.text()
      if (this.isHtmlResponse(text)) {
        console.warn('[HomeService] ⚠️ Proxy non configuré, bascule sur URL directe')
        this.useDirectUrls = true
        // Réessayer avec l'URL directe
        return this.getAllProduct(page, count)
      }

      const json = JSON.parse(text)
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
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',        // Force Laravel à répondre en JSON (pas 302)
      },
      body: {
        cip: String(cip),
        pharmacy: 'default', // Champ optionnel – backend ne l'utilise pas
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

      // Récupérer les produits de l'API epharma pour obtenir les images
      let apiProducts: any[] = []
      try {
        const apiUrl = this.getApiUrl(
          '/epharma-api/public/api/produits',
          'https://epharma-panel.srv557357.hstgr.cloud/public/api/produits'
        )
        const res = await fetch(apiUrl)
        if (res.ok) {
          const json = await res.json()
          apiProducts = Array.isArray(json?.data) ? json.data : []
        }
      } catch (e) {
        console.warn('[HomeService] Impossible de récupérer les images depuis l\'API epharma:', e)
      }

      // Créer un map CIP -> photo pour un accès rapide
      const cipToPhotoMap = new Map<string, string>()
      apiProducts.forEach((apiProduct: any) => {
        const cip = String(apiProduct.cip || apiProduct.cip_deux || '').trim()
        const photo = apiProduct.photo || apiProduct.photoURL || apiProduct.image
        if (cip && photo) {
          cipToPhotoMap.set(cip, photo)
        }
      })

      // Enrichir les résultats Excel avec les images de l'API
      const enriched = (data || []).map((p: any) => {
        const cip = String(p.cip || p.cip_deux || '').trim()
        const photoFromApi = cip ? cipToPhotoMap.get(cip) : null

        // Si on a trouvé une image dans l'API, l'utiliser, sinon normaliser avec placeholder
        if (photoFromApi) {
          return normalizeProductImage({
            ...p,
            photo: photoFromApi,
            photoURL: photoFromApi,
            image: photoFromApi
          })
        }

        return normalizeProductImage(p)
      })

      // Mettre en cache le résultat (optionnel - peut être désactivé pour forcer le rafraîchissement)
      this.searchCache.set(key, Array.isArray(enriched) ? enriched : []);
      return enriched;
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
    const path = joinUrl('api_epg', 'alternative_by_province')
    const res = await fetchApi(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        cip: payload.cip != null ? String(payload.cip) : undefined,
        province: payload.province,
        query: payload.query
      }
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

  /**
   * Send contact email via backend
   */
  async sendContactEmail(data: { name: string; email: string; message: string }) {
    const res = await fetchApi('/contact/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    })

    if (!res.ok) {
      throw new Error('Erreur lors de l\'envoi du message')
    }

    return await res.json()
  }
}
