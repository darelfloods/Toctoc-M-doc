/**
 * Utilitaire pour gérer les images de produits avec fallback vers l'image par défaut
 */

const DEFAULT_PLACEHOLDER = '/assets/placeholder.png'

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

  // Retourner l'URL de l'image
  // Vue détectera automatiquement les changements dans product.photo, product.photoURL ou product.image
  // et réévaluera cette fonction pour mettre à jour l'affichage
  return String(photoValue).trim()
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

