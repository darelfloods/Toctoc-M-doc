/**
 * Test rapide du webhook n8n
 */
export async function quickWebhookTest(medicament = 'Paracetamol'): Promise<void> {
  console.group(`🧪 Quick test webhook for: ${medicament}`)
  
  const webhookUrl = 'http://localhost:5678/webhook/659daf74-ca15-40e2-a52c-54054db41de6'
  const message = `quel est l'alternatif de ${medicament}`
  
  console.log('🎯 Message to send:', message)
  console.log('🌐 Webhook URL:', webhookUrl)
  
  try {
    // Test simple avec format prompt (le plus courant pour n8n)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: message })
    })
    
    console.log('📡 Response status:', response.status, response.statusText)
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('📄 Response text:', responseText)
    console.log('📏 Response length:', responseText.length)
    
    if (response.ok && responseText && responseText.trim() && responseText !== '{}') {
      console.log('✅ Webhook seems to be working!')
      console.log('🎯 Final message would be:', `essayé avec l'alternative: ${responseText}`)
    } else {
      console.log('❌ Webhook response is empty or invalid')
      
      // Essayer avec format message
      console.log('🔄 Trying with "message" format...')
      const response2 = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      })
      
      const responseText2 = await response2.text()
      console.log('📄 Second attempt response:', responseText2)
      
      if (response2.ok && responseText2 && responseText2.trim() && responseText2 !== '{}') {
        console.log('✅ Second format worked!')
        console.log('🎯 Final message would be:', `essayé avec l'alternative: ${responseText2}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
  
  console.groupEnd()
}

// Make it available globally in dev
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).quickWebhookTest = quickWebhookTest
}