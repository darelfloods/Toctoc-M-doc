import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CreditService } from '@/Services/CreditService'
import { useAuthStore } from './auth'

export const useCreditStore = defineStore('credit', () => {
  const credits = ref<number>(0)
  const accountId = ref<number | null>(null)
  const loading = ref<boolean>(false)
  /** Tant que défini, le solde affiché ne descend pas en dessous de ce minimum (sync serveur après paiement). */
  const settlementFloor = ref<number | null>(null)

  function beginPurchaseSettlement(expectedMinCredits: number) {
    settlementFloor.value = expectedMinCredits
    credits.value = Math.max(Number(credits.value || 0), expectedMinCredits)
  }

  function endPurchaseSettlement() {
    settlementFloor.value = null
  }

  function isPurchaseSettlementActive() {
    return settlementFloor.value !== null
  }

  async function refreshForCurrentUser() {
    const auth = useAuthStore()
    console.log('🔄 [CREDIT STORE] refreshForCurrentUser called')
    console.log('🔄 [CREDIT STORE] isLoggedIn:', auth.isLoggedIn, 'userId:', auth.currentUser?.id)
    if (!auth.isLoggedIn || !auth.currentUser?.id) {
      console.warn('⚠️ [CREDIT STORE] User not logged in, skipping refresh')
      return
    }
    loading.value = true
    try {
      console.log('📞 [CREDIT STORE] Calling getAccountByUserId...')
      const acc = await CreditService.getAccountByUserId(auth.currentUser.id)
      console.log('📦 [CREDIT STORE] Account received:', acc)
      if (acc) {
        accountId.value = acc.id
        const raw: any = (acc as any).credit ?? (acc as any).credits
        console.log('💰 [CREDIT STORE] Raw credit value:', raw, 'type:', typeof raw)
        let parsed = 0
        if (typeof raw === 'number') {
          parsed = raw
        } else if (typeof raw === 'string') {
          const onlyDigits = raw.replace(/[^0-9]/g, '')
          if (onlyDigits.length > 0) {
            parsed = parseInt(onlyDigits, 10)
          } else {
            const cleaned = raw.replace(/\s+/g, '').replace(/[,']/g, '')
            const n = Number(cleaned)
            parsed = Number.isFinite(n) ? n : 0
          }
        } else {
          parsed = 0
        }
        console.log('✅ [CREDIT STORE] Parsed credit:', parsed, '(was:', credits.value, ')')

        const floor = settlementFloor.value
        if (floor !== null) {
          credits.value = Math.max(parsed, floor)
          if (parsed >= floor) {
            settlementFloor.value = null
          }
        } else {
          credits.value = parsed
        }
      } else {
        console.warn('⚠️ [CREDIT STORE] No account returned from API')
      }
    } catch (error) {
      console.error('❌ [CREDIT STORE] Error refreshing credits:', error)
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
    credits.value = oldCredits + creditAmount

    console.log(`💰 [CREDIT STORE] SUCCÈS: ${oldCredits} + ${creditAmount} = ${credits.value} crédits`)

    setTimeout(() => {
      refreshForCurrentUser().catch(e => console.warn('Rafraîchissement différé échoué:', e))
    }, 2000)

    return true
  }

  async function debitCredits(amount: number): Promise<boolean> {
    console.log(`🏧 [CREDIT STORE] Débit demandé: ${amount} crédits`)
    if (!accountId.value) {
      console.log('⚙️ [CREDIT STORE] accountId absent, tentative de rafraîchissement')
      await refreshForCurrentUser()
    }
    if (!accountId.value) {
      console.warn('⚠️ [CREDIT STORE] Impossible de débiter : pas de compte')
      return false
    }

    try {
      const ok = await CreditService.souscrireCredit(accountId.value, amount)
      if (ok) {
        const before = credits.value
        credits.value = Math.max(0, Number(credits.value || 0) - Number(amount))
        console.log(`✅ [CREDIT STORE] Débit appliqué: ${before} -> ${credits.value}`)
        return true
      }
      console.warn('⚠️ [CREDIT STORE] Le service a retourné un échec lors du débit')
      return false
    } catch (e) {
      console.error('❌ [CREDIT STORE] Erreur lors du débit:', e)
      return false
    }
  }

  function reset() {
    credits.value = 0
    accountId.value = null
    loading.value = false
    settlementFloor.value = null
  }

  async function getVerificationCost(): Promise<number> {
    try {
      console.log('💰 [CREDIT STORE] Fetching verification cost from rates...')
      const rates = await CreditService.getAllRates()
      if (rates && rates.length > 0) {
        const verificationRate = rates.find(r =>
          r.libelle && r.libelle.toLowerCase().trim() === 'verification'
        )

        if (verificationRate && typeof verificationRate.credit === 'number') {
          console.log('✅ [CREDIT STORE] Found Verification rate:', verificationRate.credit)
          return verificationRate.credit
        }
      }

      console.log('⚠️ [CREDIT STORE] "Verification" rate not found, using default 2')
      return 2
    } catch (e) {
      console.warn('⚠️ [CREDIT STORE] Failed to fetch verification cost, using default 2', e)
      return 2
    }
  }

  return {
    credits,
    accountId,
    loading,
    refreshForCurrentUser,
    addCreditsAfterPayment,
    debitCredits,
    reset,
    getVerificationCost,
    beginPurchaseSettlement,
    endPurchaseSettlement,
    isPurchaseSettlementActive,
  }
})
