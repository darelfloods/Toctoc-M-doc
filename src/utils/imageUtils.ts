/**
 * Utilitaire pour gérer les images de produits avec fallback vers l'image par défaut
 */

const DEFAULT_PLACEHOLDER = '/assets/placeholder.png'
const EPHARMA_BASE_URL = 'https://epharma-panel.srv557357.hstgr.cloud'

/**
 * Récupère l'URL de l'image d'un produit avec fallback vers l'image par défaut
 * Cette fonction est réactive : elle sera réévaluée automatiquement quand les propriétés du produit changent
 * @param product - L'objet produit (peut avoir photo, photoURL, image)
 * @returns L'URL de l'image ou l'image par défaut
 */
export function getProductImage(product: any): string {
  if (!product) {
    return DEFAULT_PLACEHOLDER
  }

  // Essayer plusieurs champs possibles pour l'image (dans l'ordre de priorité)
  // Si une image est ajoutée ou modifiée dans n'importe quel de ces champs, elle sera détectée
  const photoValue = product.photo || product.photoURL || product.image

  // Vérifier que la valeur n'est pas vide, null, undefined ou la chaîne "null"
  if (
    !photoValue ||
    String(photoValue).toLowerCase() === 'null' ||
    String(photoValue).trim() === ''
  ) {
    return DEFAULT_PLACEHOLDER
  }

  const photoStr = String(photoValue).trim()

  // Si l'URL est déjà complète (commence par http:// ou https://), la retourner telle quelle
  if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
    return photoStr
  }

  // Si l'URL est relative (commence par / ou storage/), construire l'URL complète avec le domaine epharma
  if (photoStr.startsWith('/')) {
    return `${EPHARMA_BASE_URL}${photoStr}`
  }

  // Si l'URL commence par "storage/" ou "public/", ajouter le slash et le domaine
  if (photoStr.startsWith('storage/') || photoStr.startsWith('public/')) {
    return `${EPHARMA_BASE_URL}/${photoStr}`
  }

  // Pour toute autre valeur, essayer de construire l'URL complète
  // (au cas où ce serait juste un nom de fichier)
  return `${EPHARMA_BASE_URL}/storage/${photoStr}`
}

/**
 * Normalise un produit pour s'assurer qu'il a toujours une image valide
 * @param product - L'objet produit à normaliser
 * @returns Le produit avec les champs photo et photoURL normalisés
 */
export function normalizeProductImage(product: any): any {
  if (!product) {
    return product
  }

  const imageUrl = getProductImage(product)

  return {
    ...product,
    photo: imageUrl,
    photoURL: imageUrl,
    image: imageUrl
  }
}

