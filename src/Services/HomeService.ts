// src/Services/HomeService.ts
import { joinUrl } from '@/utils/url'
import { fetchApi } from '@/utils/api'

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
    } catch {}
    this.searchController = undefined;
  }

  /**
   * Call n8n webhook to get alternative suggestions text when no product is available in region.
   * Returns a plain text string with the mandatory prefix and markdown asterisks removed.
   */
  async askN8nAlternatives(input: { productName?: string; province?: string; cip?: string | number; rawQuery?: string }): Promise<string | null> {
    const medicamentName = input.productName || 'médicament recherché'
    
    console.log(`[HomeService] 🔍 Asking n8n alternatives for: ${medicamentName} in province: ${input.province || 'unknown'}`)
    
    // Webhook URL n8n
    const webhookUrl = 'http://localhost:5678/webhook/659daf74-ca15-40e2-a52c-54054db41de6'
    
    // Timeout configuration (5s max as requested)
    const timeoutMs = 5000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    try {
      // Format du message exact comme demandé
      const message = `quel est l'alternatif de ${medicamentName}`
      
      console.log('[HomeService] 📤 Sending message to webhook:', message)
      
      // Essayer plusieurs formats de payload au cas où n8n attend un format spécifique
      const payloads = [
        // Formats les plus courants pour n8n
        { prompt: message },
        { message: message },
        { text: message },
        { input: message },
        { query: message },
        { content: message },
        // Formats spécifiques n8n
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
            console.log(`[HomeService] 📥 Response ${i + 1} preview:`, testText.substring(0, 100))
            
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
          
          // Try multiple response field names
          const responseFields = ['alternative', 'reply', 'text', 'message', 'output', 'content', 'answer', 'result', 'response']
          for (const field of responseFields) {
            const value = (data as any)?.[field]
            if (typeof value === 'string' && value.trim()) {
              webhookResponse = value
              break
            }
          }
          
          // Check nested structures
          if (!webhookResponse) {
            const nested = (data as any)?.data?.alternative || (data as any)?.result?.text || (data as any)?.choices?.[0]?.message?.content
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
        
        // Add the mandatory prefix as requested
        const finalResponse = `essayé avec l'alternative: ${cleaned}`
        
        console.log('[HomeService] ✅ Webhook alternative found:', finalResponse)
        return finalResponse
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
    const path = joinUrl('api_epg', 'all_products', String(page), String(count));
    const res = await fetchApi(path);
    if (!res.ok) throw new Error('Erreur lors du chargement des produits');
    return await res.json();
  }

  async disponibilite(cip: string | number) {
    const path = joinUrl('api_epg', 'disponibility_product');
    const res = await fetchApi(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { cip: String(cip) }
    });
    if (!res.ok) throw new Error('Erreur lors de la vérification de disponibilité');
    return await res.json();
  }

  async searchProducts(term: string) {
    const path = joinUrl('api_epg', 'products_by_search', encodeURIComponent(term));
    const key = term.toLowerCase();
    // Retour immédiat si déjà en cache
    if (this.searchCache.has(key)) {
      return this.searchCache.get(key) as any[];
    }
    // Si on a un préfixe en cache, filtrer rapidement en attendant le réseau
    for (let i = key.length - 1; i >= 1; i--) {
      const prefix = key.slice(0, i);
      if (this.searchCache.has(prefix)) {
        const pref = this.searchCache.get(prefix) as any[];
        const quick = pref.filter((p: any) => (p?.libelle || '').toString().toLowerCase().includes(key));
        if (quick.length > 0) {
          // Ne pas enregistrer ce quick dans le cache pour éviter pollution; simplement le retourner
          // Cela rend l'expérience instantanée si des données proches existent déjà
          // On ne coupe pas ici: on pourrait renvoyer le quick, mais comme la méthode est async attendue,
          // on continue pour récupérer réseau et mettre à jour le cache.
        }
        break;
      }
    }
    // Annuler la requête précédente si elle est encore en cours
    if (this.searchController) {
      this.searchController.abort();
    }
    this.searchController = new AbortController();
    try {
      const res = await fetchApi(path, {});
      if (!res.ok) throw new Error('Erreur lors de la recherche de produits');
      const data = await res.json();
      // Mettre en cache le résultat
      this.searchCache.set(key, Array.isArray(data) ? data : []);
      return data;
    } catch (err: any) {
      // Si la requête est annulée, retourner un tableau vide pour ignorer ce résultat
      if (err?.name === 'AbortError') {
        return [];
      }
      throw err;
    } finally {
      // Nettoyage du controller courant seulement s'il s'agit du même
      this.searchController = undefined;
    }
  }

  /**
   * Ask backend for an alternative product suggestion constrained by province
   * Payload fields are optional to let backend use best available signal.
   * Expected response shape (example): { libelle: string, cip?: string, [k:string]: any } | null
   */
  async alternativeByProvince(payload: { cip?: string | number; province?: string; query?: string }) {
    const url = joinUrl(this.apiEpgBase, 'alternative_by_province')
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
