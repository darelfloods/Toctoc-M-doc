// Utilitaire de test pour l'intégration webhook n8n
export class WebhookTester {
  private static readonly WEBHOOK_URL = 'https://backend.srv1079351.hstgr.cloud/:5678/webhook/659daf74-ca15-40e2-a52c-54054db41de6'

  /**
   * Test the n8n webhook with sample data
   */
  static async testWebhook(medicamentName = 'Paracetamol'): Promise<void> {
    console.group('[WebhookTester] 🧪 Testing n8n webhook integration')

    try {
      const testPayload = {
        message: `quel est l'alternatif de ${medicamentName}`
      }

      console.log('[WebhookTester] 📤 Sending test payload:', testPayload)
      console.log('[WebhookTester] 🌐 Webhook URL:', this.WEBHOOK_URL)

      const startTime = Date.now()

      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      })

      const responseTime = Date.now() - startTime
      console.log(`[WebhookTester] ⏱️ Response time: ${responseTime}ms`)

      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          const data = await response.json()
          console.log('[WebhookTester] ✅ JSON Response received:', data)

          // Check for response field
          const responseFields = ['reply', 'text', 'message', 'output', 'content', 'answer', 'result', 'response']
          let webhookResponse = null

          for (const field of responseFields) {
            if (data[field] && typeof data[field] === 'string') {
              webhookResponse = data[field]
              break
            }
          }

          if (webhookResponse) {
            console.log('[WebhookTester] 🎯 Response found:', webhookResponse)
            console.log('[WebhookTester] 📝 Final message would be:', `essayé avec l'alternative: ${webhookResponse}`)
          } else {
            console.warn('[WebhookTester] ⚠️ No valid response field found in:', Object.keys(data))
          }
        } else {
          const text = await response.text()
          console.log('[WebhookTester] 📄 Text response:', text)
          console.log('[WebhookTester] 📝 Final message would be:', `essayé avec l'alternative: ${text}`)
        }

        console.log('[WebhookTester] ✅ Test completed successfully!')

      } else {
        console.error(`[WebhookTester] ❌ Webhook failed with status ${response.status}: ${response.statusText}`)
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[WebhookTester] Error details:', errorText)
      }

    } catch (error: any) {
      console.error('[WebhookTester] ❌ Test failed with exception:', error)

      if (error?.name === 'AbortError') {
        console.error('[WebhookTester] ⏰ Request timed out')
      } else if (error?.message?.includes('fetch')) {
        console.error('[WebhookTester] 🌐 Network error - check if n8n is running on localhost:5678')
      }
    } finally {
      console.groupEnd()
    }
  }

  /**
   * Quick webhook availability check
   */
  static async checkWebhookAvailability(): Promise<boolean> {
    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'quel est l\'alternatif de test' })
      })

      return response.status !== 404
    } catch {
      return false
    }
  }
}

// Global function for easy console testing
if (typeof window !== 'undefined') {
  (window as any).testWebhook = WebhookTester.testWebhook;
  (window as any).checkWebhook = WebhookTester.checkWebhookAvailability;
}