import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CreditService } from '@/Services/CreditService'
import { useAuthStore } from './auth'

export const useCreditStore = defineStore('credit', () => {
  const credits = ref<number>(0)
  const accountId = ref<number | null>(null)
  const loading = ref<boolean>(false)

  async function refreshForCurrentUser() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn || !auth.currentUser?.id) return
    loading.value = true
    try {
      const acc = await CreditService.getAccountByUserId(auth.currentUser.id)
      if (acc) {
        accountId.value = acc.id
        // Back-end renvoie typiquement le champ "credit"; il peut être un nombre ou une chaîne formatée (ex: "9 433", "9,433", "9.433", "9’433")
        const raw: any = (acc as any).credit ?? (acc as any).credits
        let parsed = 0
        if (typeof raw === 'number') {
          parsed = raw
        } else if (typeof raw === 'string') {
          // Stratégie la plus robuste: retirer tout ce qui n'est pas un chiffre, puis parser en entier
          // Exemple: "9 433", "9,433", "9.433", "9’433", "9433,00" -> "9433"
          const onlyDigits = raw.replace(/[^0-9]/g, '')
          if (onlyDigits.length > 0) {
            parsed = parseInt(onlyDigits, 10)
          } else {
            // fallback plus permissif
            const cleaned = raw.replace(/\s+/g, '').replace(/[,']/g, '')
            const n = Number(cleaned)
            parsed = Number.isFinite(n) ? n : 0
          }
        } else {
          parsed = 0
        }
        credits.value = parsed
      }
    } finally {
      loading.value = false
    }
  }

  async function addCreditsAfterPayment(creditAmount: number): Promise<boolean> {
    console.log(`🏦 [CREDIT STORE] AJOUT MANUEL de ${creditAmount} crédits`)
    
    if (!accountId.value) {
      console.warn('⚠️ [CREDIT STORE] Pas de compte ID')
      return false
    }
    
    const oldCredits = credits.value
    
    // 🎯 AJOUT DIRECT ET SIMPLE - Bypass de tous les endpoints défaillants
    // On ajoute directement les crédits calculés par resolvePricing()
    credits.value = oldCredits + creditAmount
    
    console.log(`💰 [CREDIT STORE] SUCCÈS: ${oldCredits} + ${creditAmount} = ${credits.value} crédits`)
    
    // Optionnel: Sauvegarder le nouveau solde via un rafraîchissement en arrière-plan
    // (ne pas attendre le résultat pour ne pas bloquer l'UI)
    setTimeout(() => {
      refreshForCurrentUser().catch(e => console.warn('Rafraîchissement différé échoué:', e))
    }, 2000)
    
    return true
  }

  function reset() {
    credits.value = 0
    accountId.value = null
    loading.value = false
  }

  return {
    credits,
    accountId,
    loading,
    refreshForCurrentUser,
    addCreditsAfterPayment,
    reset,
  }
})
