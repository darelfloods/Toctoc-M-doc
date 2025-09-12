// src/utils/api.ts
import { ENV } from '@/config/environment'
import { joinUrl } from '@/utils/url'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface FetchApiOptions {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: any
}

let cachedWorkingBase: string | null = null

export async function fetchApi(path: string, options: FetchApiOptions = {}): Promise<Response> {
  const bases = cachedWorkingBase ? [cachedWorkingBase] : ENV.API_BASE_URLS
  let lastError: any

  try { console.debug('[fetchApi] path=', path, 'bases=', bases) } catch {}

  for (const base of bases) {
    // If base is empty or '/', force a leading slash so we target root-relative path
    const normalizedBase = (base === '' || base === '/') ? '/' : base
    const url = joinUrl(normalizedBase, path)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), ENV.API_TIMEOUT_MS)
      const init: RequestInit = {
        method: options.method || 'GET',
        headers: options.headers,
        signal: controller.signal,
      }
      if (options.body && init.method !== 'GET') {
        if (options.body instanceof FormData) {
          init.body = options.body
        } else {
          init.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
          init.body = JSON.stringify(options.body)
        }
      }

      const res = await fetch(url, init)
      clearTimeout(timeout)
      if (res.ok) {
        // If server returned HTML (e.g., SPA fallback like index.html), consider it invalid for API
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('text/html')) {
          lastError = new Error(`Got HTML from ${url}, skipping (content-type=${ct})`)
          try { console.warn('[fetchApi] HTML received instead of JSON, skip url=', url, 'ct=', ct) } catch {}
        } else {
          cachedWorkingBase = base
          try { console.info('[fetchApi] Using base=', base, 'url=', url) } catch {}
          return res
        }
      }
      // If non-2xx, keep this as lastError but try next base
      lastError = new Error(`HTTP ${res.status} ${res.statusText} at ${url}`)
      try { console.warn('[fetchApi] HTTP error', res.status, res.statusText, 'url=', url) } catch {}
    } catch (e) {
      lastError = e
      try { console.error('[fetchApi] Error for base=', base, 'url=', url, e) } catch {}
    }
  }

  try { console.error('[fetchApi] No API base reachable for path=', path, 'lastError=', lastError) } catch {}
  throw lastError || new Error('No API base reachable')
}
