// Diagnostic avancé pour l'intégration webhook n8n
export class WebhookDiagnostic {
  private static readonly WEBHOOK_URL = 'http://localhost:5678/webhook-test/659daf74-ca15-40e2-a52c-54054db41de6'
  
  /**
   * Test diagnostique complet du webhook
   */
  static async runFullDiagnostic(medicament = 'Paracetamol'): Promise<void> {
    console.group('[WebhookDiagnostic] 🔍 Running full webhook diagnostic')
    
    const message = `quel est l'alternatif de ${medicament}`
    
    // 1. Test de connectivité basique
    await this.testConnectivity()
    
    // 2. Test de différents formats de payload
    await this.testPayloadFormats(message)
    
    // 3. Test des méthodes HTTP
    await this.testHttpMethods(message)
    
    // 4. Test avec différents headers
    await this.testDifferentHeaders(message)
    
    console.groupEnd()
  }
  
  private static async testConnectivity(): Promise<void> {
    console.log('[WebhookDiagnostic] 🌐 Testing basic connectivity...')
    
    try {
      const response = await fetch(this.WEBHOOK_URL, { 
        method: 'OPTIONS',
        timeout: 3000 
      } as any)
      
      console.log(`[WebhookDiagnostic] ✅ Connectivity OK (${response.status})`)
      console.log('[WebhookDiagnostic] Headers:', Object.fromEntries(response.headers.entries()))
      
    } catch (e) {
      console.error('[WebhookDiagnostic] ❌ Connectivity failed:', e)
    }
  }
  
  private static async testPayloadFormats(message: string): Promise<void> {
    console.log('[WebhookDiagnostic] 📦 Testing payload formats...')
    
    const formats = [
      { name: 'message', payload: { message } },
      { name: 'prompt', payload: { prompt: message } },
      { name: 'text', payload: { text: message } },
      { name: 'query', payload: { query: message } },
      { name: 'input', payload: { input: message } },
      { name: 'content', payload: { content: message } },
      { name: 'data', payload: { data: message } },
      { name: 'body', payload: { body: message } },
      { name: 'request', payload: { request: message } }
    ]
    
    for (const format of formats) {
      try {
        console.log(`[WebhookDiagnostic] Testing format "${format.name}":`, format.payload)
        
        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(format.payload)
        })
        
        const responseText = await response.text()
        
        console.log(`[WebhookDiagnostic] Format "${format.name}" response:`)
        console.log(`  Status: ${response.status}`)
        console.log(`  Response length: ${responseText.length}`)
        console.log(`  Response preview: "${responseText.substring(0, 100)}..."`)
        
        if (responseText && responseText.trim() && responseText !== '{}' && responseText !== 'null') {
          console.log(`[WebhookDiagnostic] ✅ Format "${format.name}" seems to work!`)
        }
        
      } catch (e) {
        console.warn(`[WebhookDiagnostic] ⚠️ Format "${format.name}" failed:`, e)
      }
    }
  }
  
  private static async testHttpMethods(message: string): Promise<void> {
    console.log('[WebhookDiagnostic] 🔧 Testing HTTP methods...')
    
    // Test POST
    try {
      const postResponse = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      const postText = await postResponse.text()
      console.log('[WebhookDiagnostic] POST response:', {
        status: postResponse.status,
        length: postText.length,
        preview: postText.substring(0, 50)
      })
    } catch (e) {
      console.warn('[WebhookDiagnostic] POST failed:', e)
    }
    
    // Test GET
    try {
      const getUrl = `${this.WEBHOOK_URL}?message=${encodeURIComponent(message)}`
      const getResponse = await fetch(getUrl, { method: 'GET' })
      const getText = await getResponse.text()
      console.log('[WebhookDiagnostic] GET response:', {
        status: getResponse.status,
        length: getText.length,
        preview: getText.substring(0, 50)
      })
    } catch (e) {
      console.warn('[WebhookDiagnostic] GET failed:', e)
    }
  }
  
  private static async testDifferentHeaders(message: string): Promise<void> {
    console.log('[WebhookDiagnostic] 🏷️ Testing different headers...')
    
    const headerSets = [
      { 'Content-Type': 'application/json' },
      { 'Content-Type': 'application/x-www-form-urlencoded' },
      { 'Content-Type': 'text/plain' },
      { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Vue-App/1.0'
      }
    ]
    
    for (let i = 0; i < headerSets.length; i++) {
      try {
        console.log(`[WebhookDiagnostic] Testing headers set ${i + 1}:`, headerSets[i])
        
        let body: string
        if (headerSets[i]['Content-Type'] === 'application/x-www-form-urlencoded') {
          body = `message=${encodeURIComponent(message)}`
        } else if (headerSets[i]['Content-Type'] === 'text/plain') {
          body = message
        } else {
          body = JSON.stringify({ message })
        }
        
        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          headers: headerSets[i],
          body: body
        })
        
        const responseText = await response.text()
        console.log(`[WebhookDiagnostic] Headers set ${i + 1} response:`, {
          status: response.status,
          length: responseText.length,
          preview: responseText.substring(0, 50)
        })
        
      } catch (e) {
        console.warn(`[WebhookDiagnostic] Headers set ${i + 1} failed:`, e)
      }
    }
  }
}

// Fonction globale pour la console
if (typeof window !== 'undefined') {
  (window as any).runWebhookDiagnostic = WebhookDiagnostic.runFullDiagnostic
}