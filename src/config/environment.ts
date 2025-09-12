// Configuration de l'environnement
export const ENV = {
  // URL de base de l'API
  API_BASE_URL:
    // Utiliser l'URL explicite si fournie, sinon la valeur par défaut avec port 8000
    (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'https://51.68.46.67:8000',

  // Liste ordonnée des bases (avec fallback). La première qui répond est utilisée.
  API_BASE_URLS: (() => {
    const list: string[] = []
    const norm = (u?: string) => (u ? String(u).replace(/\/+$/g, '') : u)
    const candidates = [
      norm(import.meta.env.VITE_API_BASE_URL),
      norm(import.meta.env.VITE_API_FALLBACK_BASE_URL),
      'https://51.68.46.67:8000',
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

  // API timeout (ms)
  API_TIMEOUT_MS: Number(import.meta.env.VITE_API_TIMEOUT_MS || 12000),
} as const

// Validation de la configuration
if (!ENV.API_BASE_URL) {
  console.warn("VITE_API_BASE_URL n'est pas défini, utilisation de la valeur par défaut")
}
