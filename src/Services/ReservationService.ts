import { useAuthStore } from '../stores/auth'

export interface ReservationPayload {
  created_by: string
  client_id: number
  libelle: string
  status: string
  caisse: string
  client: string
  montant: number
  montant_taxe: number
  total: number
}

export class ReservationService {

  // Récupérer automatiquement le fullname depuis l'interface epharma
  private static async getEpharmaUserName(): Promise<string> {
    // Essayer de récupérer depuis le localStorage d'abord
    const savedUserName = localStorage.getItem('epharma_created_by')
    if (savedUserName) {
      return savedUserName
    }

    // Essayer de récupérer le fullname depuis l'API epharma
    try {
      // Utiliser le proxy Vercel en prod et le proxy Vite en dev pour contourner CORS
      const base = '/reservations-api'

      // D'abord essayer de récupérer l'utilisateur connecté via l'API
      const userResponse = await fetch(`${base}/api/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        const fullname = userData?.fullname || userData?.name
        if (fullname) {
          console.log(`[ReservationService] Fullname récupéré depuis epharma API: "${fullname}"`)
          localStorage.setItem('epharma_created_by', fullname)
          return fullname
        }
      }

      // Fallback: essayer l'endpoint user-info
      const infoResponse = await fetch(`${base}/api/user-info`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (infoResponse.ok) {
        const userData = await infoResponse.json()
        const fullname = userData?.user?.fullname || userData?.fullname || userData?.data?.fullname
        if (fullname) {
          console.log(`[ReservationService] Fullname récupéré depuis epharma user-info: "${fullname}"`)
          localStorage.setItem('epharma_created_by', fullname)
          return fullname
        }
      }
    } catch (error) {
      console.warn('[ReservationService] Impossible de récupérer le fullname depuis epharma:', error)
    }

    // Fallback sur le nom "superadmin" pour les tests
    const defaultUser = 'superadmin'

    console.warn(`[ReservationService] Utilisation du nom par défaut: "${defaultUser}"`)
    console.warn('[ReservationService] Si les réservations ne s\'affichent pas, connectez-vous à epharma puis relancez ou configurez le bon nom avec:')
    console.warn('ReservationService.setEpharmaUserName("Nom_Exact_Depuis_Epharma")')
    return defaultUser
  }

  // Permettre de configurer le nom utilisateur epharma
  static setEpharmaUserName(userName: string): void {
    localStorage.setItem('epharma_created_by', userName)
    console.log(`[ReservationService] Nom utilisateur epharma configuré: ${userName}`)
  }

  // Initialiser la session Laravel en récupérant le token CSRF
  private static async initializeSession(): Promise<void> {
    try {
      // Utiliser le proxy Vercel en prod et le proxy Vite en dev pour contourner CORS
      const base = '/reservations-api'

      console.log('[ReservationService] Initializing session...')

      // Appel GET pour récupérer la page et initialiser la session
      const response = await fetch(`${base}/`, {
        method: 'GET',
        credentials: 'include'
      })

      console.log('[ReservationService] Session init response:', response.status)

    } catch (error) {
      console.warn('[ReservationService] Session init failed:', error)
    }
  }

  // Fonction utilitaire pour récupérer le token XSRF depuis les cookies
  private static getXsrfToken(): string | null {
    try {
      const name = 'XSRF-TOKEN='
      const decodedCookie = decodeURIComponent(document.cookie)
      const cookies = decodedCookie.split(';')
      for (let cookie of cookies) {
        cookie = cookie.trim()
        if (cookie.indexOf(name) === 0) {
          return cookie.substring(name.length)
        }
      }
      return null
    } catch {
      return null
    }
  }

  static async createReservation(payload: ReservationPayload): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Initialiser la session Laravel si pas de token CSRF
      if (!this.getXsrfToken()) {
        await this.initializeSession()
      }

      // Utiliser le proxy Vercel en prod et le proxy Vite en dev pour contourner CORS
      const base = '/reservations-api'

      const url = `${base}/api/reservations`

      console.log('[ReservationService] Creating reservation:', payload)
      console.log('[ReservationService] Target URL:', url)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }

      // Ajouter le token XSRF si disponible (nécessaire pour Laravel)
      const xsrfToken = this.getXsrfToken()
      if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken
        console.log('[ReservationService] Using XSRF token:', xsrfToken.substring(0, 20) + '...')
      } else {
        console.log('[ReservationService] No XSRF token found')
      }

      console.log('[ReservationService] Request headers:', headers)

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        credentials: 'include', // Important pour les cookies de session
        body: JSON.stringify(payload)
      })

      console.log('[ReservationService] Response status:', response.status)
      console.log('[ReservationService] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text().catch(() => `HTTP ${response.status}`)
        console.error('[ReservationService] Error response:', errorText)
        console.error('[ReservationService] Failed payload was:', payload)
        return {
          success: false,
          error: `Erreur ${response.status}: ${errorText}`
        }
      }

      const data = await response.json()
      console.log('[ReservationService] SUCCESS - Reservation created:', data)
      console.log('[ReservationService] Reservation ID:', data?.id || data?.data?.id)
      console.log('[ReservationService] Reservation status:', data?.status || data?.data?.status)

      return {
        success: true,
        data: data
      }

    } catch (error: any) {
      console.error('[ReservationService] Network error:', error)
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      }
    }
  }

  static async buildReservationPayload(items: any[], userInfo: any): Promise<ReservationPayload> {
    // Utiliser le nom utilisateur configuré pour epharma
    // CRITIQUE: Ce nom doit correspondre EXACTEMENT au fullname de l'utilisateur connecté dans epharma
    const userName = await this.getEpharmaUserName()

    // Calculer le total des articles au format epharma
    const total = items.reduce((sum, item) => {
      // Utiliser la même logique d'extraction de prix que addProductsToReservation
      let unitPrice = 0
      const sources = [
        item.unitPrice,
        item.product?.prix_de_vente,
        item.product?.prix,
        item.product?.price,
        item.pharmacy?.prix_de_vente,
        item.pharmacy?.prix,
        item.pharmacy?.tarif,
        item.pharmacie?.prix_de_vente,
        item.pharmacie?.prix,
        item.pharmacie?.tarif
      ]

      for (const source of sources) {
        if (source != null) {
          const parsed = parseFloat(String(source))
          if (!isNaN(parsed) && parsed > 0) {
            unitPrice = parsed
            break
          }
        }
      }

      const quantity = item.quantite || 1
      return sum + (unitPrice * quantity)
    }, 0)

    const payload = {
      // Champs obligatoires pour epharma
      created_by: userName,
      client_id: 1, // ID COMPTANT dans epharma
      libelle: "COMPTANT", // Type de client
      status: "Brouillon", // Statut initial - CRUCIAL pour l'affichage
      client: "COMPTANT", // Nom du client
      caisse: "Default", // Caisse par défaut

      // Montants
      montant: total, // Montant que le client doit payer
      montant_taxe: 0, // Taxes
      total: total // Montant total de la facture
    }

    console.log(`[ReservationService] Payload created_by: "${userName}"`)
    console.log('[ReservationService] IMPORTANT: Assurez-vous que ce nom correspond au fullname dans epharma!')

    return payload
  }

  static async addProductsToReservation(reservationId: number, items: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Utiliser le proxy Vercel en prod et le proxy Vite en dev pour contourner CORS
      const base = '/reservations-api'

      // Envoyer chaque produit individuellement avec tous les champs epharma
      for (const item of items) {
        console.log('[ReservationService] Item complet:', item)

        // ADAPTATION TTM → EPHARMA : Transformer les données TTM au format epharma
        console.log('[ReservationService] Item TTM brut:', item)

        // Extraire le prix depuis toutes les sources possibles de TTM
        let unitPrice = 0
        const sources = [
          item.unitPrice,                    // Prix calculé par le store TTM
          item.product?.prix_de_vente,      // Format epharma si déjà présent
          item.product?.prix,               // Format TTM
          item.product?.price,              // Format alternatif
          item.pharmacy?.prix_de_vente,     // Prix de la pharmacie
          item.pharmacy?.prix,              // Prix alternatif pharmacie
          item.pharmacy?.tarif,             // Tarif pharmacie
          item.pharmacie?.prix_de_vente,    // Variant orthographique
          item.pharmacie?.prix,
          item.pharmacie?.tarif
        ]

        for (const source of sources) {
          if (source != null) {
            const parsed = parseFloat(String(source))
            if (!isNaN(parsed) && parsed > 0) {
              unitPrice = parsed
              console.log('[ReservationService] Prix trouvé:', unitPrice, 'depuis source:', source)
              break
            }
          }
        }

        // CRÉER UN PRODUIT AU FORMAT EPHARMA
        const epharmaProduct = {
          // Champs obligatoires epharma
          libelle: item.product?.libelle || item.product?.nom || item.product?.name || 'Produit TTM',
          prix_de_vente: unitPrice,           // ← CRUCIAL : format epharma
          prix_achat: unitPrice * 0.8,       // Estimation prix d'achat
          qte: Number(item.quantite || 1),

          // Champs additionnels depuis TTM
          id: item.product?.id || item.product?.cip || item.product?.ID,
          cip: item.product?.cip || item.product?.id,

          // Préserver les données TTM originales
          ...item.product
        }

        console.log('[ReservationService] Produit transformé au format epharma:', epharmaProduct)

        const quantity = Number(item.quantite || 1)
        const coutTotal = unitPrice * quantity

        const produitId = epharmaProduct.cip || epharmaProduct.id

        // Validation du produit
        if (!produitId) {
          console.error('[ReservationService] Produit sans identifiant:', item.product)
          return {
            success: false,
            error: `Produit "${item.product?.libelle || 'Inconnu'}" sans identifiant valide`
          }
        }

        const productPayload = {
          reservation_id: reservationId,
          produit_id: produitId,
          libelle: epharmaProduct.libelle,
          qte: quantity,
          prix_de_vente: epharmaProduct.prix_de_vente,  // ← Utilise le prix au format epharma
          prix_achat: epharmaProduct.prix_achat,        // ← Utilise le prix d'achat calculé
          cout_total: coutTotal,
          cout_total_reel: coutTotal,
          produit: JSON.stringify(epharmaProduct), // ← Produit au format epharma
          prise_en_charge: 0, // Pas de prise en charge par défaut
          total_ht: coutTotal * 0.85, // Estimation HT (85% du total)
          total_tva: coutTotal * 0.15, // Estimation TVA (15%)
          total_css: 0, // Pas de CSS par défaut
          total_garde: 0, // Pas de garde par défaut
          total_prise_en_charge: 0, // Pas de prise en charge
          is_sold: false, // Pas encore vendu
          statut: 'Réservé' // Statut initial
        }

        console.log('[ReservationService] Adding product:', productPayload)

        const url = `${base}/api/reservation_produits`

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }

        // Ajouter le token XSRF si disponible
        const xsrfToken = this.getXsrfToken()
        if (xsrfToken) {
          headers['X-XSRF-TOKEN'] = xsrfToken
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify(productPayload)
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => `HTTP ${response.status}`)
          console.error('[ReservationService] Error adding product:', errorText)
          return {
            success: false,
            error: `Erreur ajout produit: ${errorText}`
          }
        }
      }

      return { success: true }

    } catch (error: any) {
      console.error('[ReservationService] Error adding products:', error)
      return {
        success: false,
        error: error.message || 'Erreur ajout produits'
      }
    }
  }
}