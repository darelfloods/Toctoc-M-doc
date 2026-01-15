// Configuration de l'environnement

// Nouvelle URL du backend TTM
const PRIMARY_BACKEND_URL = 'http://ttm-backend.srv1079351.hstgr.cloud/'
const FALLBACK_BACKEND_URL = 'http://ttm-backend.srv1079351.hstgr.cloud/'

export const ENV = {
  // URL de base de l'API - Backend TTM sur Hostinger
  API_BASE_URL:
    // Priorité: Variable d'environnement > Backend Hostinger HTTPS > Fallback HTTP
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    PRIMARY_BACKEND_URL,

  // Liste ordonnée des bases (avec fallback). La première qui répond est utilisée.
  API_BASE_URLS: (() => {
    const list: string[] = []
    const norm = (u?: string) => (u ? String(u).replace(/\/+$/g, '') : u)

    // En production, utiliser HTTPS puis fallback HTTP si nécessaire
    if (import.meta.env.PROD) {
      const envUrl = norm(import.meta.env.VITE_API_BASE_URL)
      if (envUrl) {
        list.push(envUrl)
      }
      list.push(PRIMARY_BACKEND_URL)
      return list
    }

    // En développement, utiliser uniquement le backend distant
    const candidates = [
      norm(import.meta.env.VITE_API_BASE_URL),
      PRIMARY_BACKEND_URL,
    ] as const
    for (const c of candidates) {
      if (c && !list.includes(c)) list.push(c)
    }
    return list
  })(),

  // Environnement de l'application
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',

  // Mode développement
  IS_DEV: import.meta.env.DEV,

  // Mode production
  IS_PROD: import.meta.env.PROD,

  // API timeout (ms) - 60s pour le backend qui peut être en sleep mode
  API_TIMEOUT_MS: Number(import.meta.env.VITE_API_TIMEOUT_MS || 60000),
} as const

// Validation de la configuration
if (!ENV.API_BASE_URL) {
  console.warn("VITE_API_BASE_URL n'est pas défini, utilisation de la valeur par défaut")
}

/**
 * Fonction utilitaire pour tester si une URL est accessible
 * Utilisée pour le fallback automatique HTTPS -> HTTP
 */
export async function testApiConnection(url: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(`${url}/`, {
      method: 'HEAD',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok || response.status < 500
  } catch {
    return false
  }
}

/**
 * Trouve la première URL de backend fonctionnelle
 * Tente HTTPS en premier, puis bascule sur HTTP si nécessaire
 */
export async function getWorkingApiUrl(): Promise<string> {
  for (const url of ENV.API_BASE_URLS) {
    if (await testApiConnection(url)) {
      console.log(`✅ Backend connecté: ${url}`)
      return url
    }
    console.warn(`⚠️ Backend non accessible: ${url}`)
  }

  // Retourne l'URL par défaut si aucune ne fonctionne
  console.error('❌ Aucun backend accessible, utilisation de l\'URL par défaut')
  return ENV.API_BASE_URL
}
