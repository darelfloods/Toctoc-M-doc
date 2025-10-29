// src/Services/GroqService.ts
// Service pour le parsing intelligent de requêtes avec Groq AI (Llama 3.1 70B)
// API gratuite et ultra-rapide : https://console.groq.com

export interface ParsedQuery {
  productName: string
  quantity: number
  place: string | null
}

export class GroqService {
  private static readonly API_URL = 'https://api.groq.com/openai/v1/chat/completions'
  private static readonly MODEL = 'llama-3.1-70b-versatile' // Modèle gratuit et rapide

  /**
   * Parse une requête naturelle en utilisant l'IA Groq
   * Extrait: nom du produit, quantité, et lieu (province/ville)
   */
  static async parseQuery(userQuery: string): Promise<ParsedQuery> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
      console.warn('[GroqService] ⚠️ VITE_GROQ_API_KEY non définie, utilisation du parsing local')
      // Fallback vers parsing local si pas de clé API
      return this.fallbackParsing(userQuery)
    }

    const systemPrompt = `Tu es un assistant spécialisé dans l'extraction d'informations de commandes pharmaceutiques au Gabon.

PROVINCES VALIDES: Estuaire, Haut-Ogooué, Moyen-Ogooué, Ngounié, Nyanga, Ogooué-Ivindo, Ogooué-Lolo, Ogooué-Maritime, Woleu-Ntem

VILLES CONNUES: Libreville, Owendo, Akanda, Port-Gentil, Franceville, Oyem, Moanda

Ta tâche: Extraire 3 informations d'une phrase en langage naturel:
1. **productName**: Le nom du médicament (garde la casse originale EXACTEMENT comme écrite par l'utilisateur)
2. **quantity**: La quantité demandée (nombre entier, défaut: 1)
3. **place**: La province ou ville mentionnée (orthographe exacte, null si absent)

RÈGLES STRICTES:
- Garde le nom du produit EXACTEMENT comme écrit (ne change PAS la casse)
- Ne confonds JAMAIS les dosages (500mg, 100ml) avec les quantités
- Si aucune quantité n'est mentionnée, utilise 1
- Si aucun lieu n'est mentionné, utilise null
- Réponds UNIQUEMENT en JSON valide, format: {"productName":"produit","quantity":N,"place":"Lieu"}

EXEMPLES:
Input: "Je suis à l'Estuaire et veux 2 EFFERALGAN"
Output: {"productName":"EFFERALGAN","quantity":2,"place":"Estuaire"}

Input: "2 efferalgan à l'Estuaire"
Output: {"productName":"efferalgan","quantity":2,"place":"Estuaire"}

Input: "Efferalgan dans l'Estuaire 2 boîtes"
Output: {"productName":"Efferalgan","quantity":2,"place":"Estuaire"}

Input: "PARACETAMOL 500mg vers Haut-Ogooué, j'en veux 3"
Output: {"productName":"PARACETAMOL","quantity":3,"place":"Haut-Ogooué"}

Input: "Je cherche de l'aspirine"
Output: {"productName":"aspirine","quantity":1,"place":null}

Input: "2 boîtes d'Aspirine à Libreville"
Output: {"productName":"Aspirine","quantity":2,"place":"Libreville"}

Réponds UNIQUEMENT avec le JSON, sans explication.`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      console.log('[GroqService] 🤖 Envoi de la requête à Groq:', userQuery)

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuery }
          ],
          temperature: 0.1, // Très faible pour des résultats déterministes
          max_tokens: 150,
          top_p: 1,
          stream: false
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('[GroqService] ❌ Erreur API:', response.status, errorText)
        return this.fallbackParsing(userQuery)
      }

      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content?.trim()

      if (!content) {
        console.warn('[GroqService] ⚠️ Réponse vide de Groq')
        return this.fallbackParsing(userQuery)
      }

      console.log('[GroqService] 📥 Réponse brute:', content)

      // Parser le JSON retourné par l'IA
      let parsed: ParsedQuery
      try {
        // Nettoyer le JSON (parfois l'IA ajoute des backticks markdown)
        const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        parsed = JSON.parse(cleanedContent)
      } catch (e) {
        console.error('[GroqService] ❌ Impossible de parser le JSON:', content)
        return this.fallbackParsing(userQuery)
      }

      // Validation (on garde la casse originale pour le productName)
      const result: ParsedQuery = {
        productName: (parsed.productName || '').toString().trim(),
        quantity: Math.max(1, parseInt(String(parsed.quantity || 1), 10)),
        place: parsed.place ? String(parsed.place).trim() : null
      }

      console.log('[GroqService] ✅ Parsing réussi:', result)
      return result

    } catch (e: any) {
      if (e?.name === 'AbortError') {
        console.warn('[GroqService] ⏰ Timeout après 10s')
      } else {
        console.error('[GroqService] ❌ Erreur:', e)
      }
      return this.fallbackParsing(userQuery)
    }
  }

  /**
   * Parsing local de secours (si API indisponible)
   * Utilise des règles simples pour extraire les informations
   */
  private static fallbackParsing(query: string): ParsedQuery {
    console.log('[GroqService] 🔄 Utilisation du parsing de secours')

    const text = query.toLowerCase()

    // Extraire la quantité
    let quantity = 1
    const qtyMatch = text.match(/(\d{1,2})\s*(boite|boîte|flacon|unite|unité|x)?/i)
    if (qtyMatch) {
      const val = parseInt(qtyMatch[1], 10)
      if (val > 0 && val <= 20) quantity = val
    }

    // Extraire le lieu (provinces gabonaises)
    const provinces = [
      'Estuaire', 'Haut-Ogooué', 'Moyen-Ogooué', 'Ngounié',
      'Nyanga', 'Ogooué-Ivindo', 'Ogooué-Lolo', 'Ogooué-Maritime', 'Woleu-Ntem'
    ]
    let place: string | null = null
    for (const prov of provinces) {
      if (text.includes(prov.toLowerCase())) {
        place = prov
        break
      }
    }

    // Extraire le produit (mots en majuscules ou après mots-clés)
    const productMatch = query.match(/\b([A-Z][A-Z]+)\b/)
    const productName = productMatch ? productMatch[1] : ''

    return { productName, quantity, place }
  }
}
