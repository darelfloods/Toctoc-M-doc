// Configuration de l'environnement
export const ENV = {
  // URL de base de l'API - Backend TTM sur Render
  API_BASE_URL:
    // Priorité: Variable d'environnement > Backend Render > Backend local (dev) > Anciens serveurs
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    'https://api-ttm.onrender.com',

  // Liste ordonnée des bases (avec fallback). La première qui répond est utilisée.
  API_BASE_URLS: (() => {
    const list: string[] = []
    const norm = (u?: string) => (u ? String(u).replace(/\/+$/g, '') : u)
    const candidates = [
      norm(import.meta.env.VITE_API_BASE_URL),
      'https://api-ttm.onrender.com', // Backend Render en priorité
      'http://localhost:8000', // Backend local pour développement
      norm(import.meta.env.VITE_API_FALLBACK_BASE_URL),
      'https://51.68.46.67:8000', // Ancien backend hébergé
      'https://vps-b9ccb6e1.vps.ovh.net:8000', // Ancien serveur
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

  // API timeout (ms) - 60s pour Render qui peut être en sleep mode
  API_TIMEOUT_MS: Number(import.meta.env.VITE_API_TIMEOUT_MS || 60000),
} as const

// Validation de la configuration
if (!ENV.API_BASE_URL) {
  console.warn("VITE_API_BASE_URL n'est pas défini, utilisation de la valeur par défaut")
}
