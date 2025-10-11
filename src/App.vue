<!-- App.vue -->
<template>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'

// Wake up n8n on Render (free tier sleeps after 15min inactivity)
onMounted(() => {
  const n8nUrl = 'https://n8n-workflows-cktx.onrender.com/webhook/8e3590f6-96f5-4761-98f3-a487f882b066'

  const sendWakeupPing = () => {
    fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '__ping__',
        source: 'app-wakeup'
      })
    }).catch(() => {
      // Silently fail - it's just a wakeup call
      console.log('[App] n8n wakeup ping sent')
    })
  }

  // Send initial ping on app load
  sendWakeupPing()

  // Send ping every 10 minutes to keep n8n awake
  const keepAliveInterval = setInterval(sendWakeupPing, 10 * 60 * 1000) // 10 min

  // Cleanup interval on unmount
  return () => clearInterval(keepAliveInterval)
})
</script>
