// Shared TypeScript interfaces to align Vue with Angular models

export interface Product {
  id?: number | string
  cip?: string
  libelle: string
  prix?: number
  prix_de_vente?: number
  photoURL?: string
  prescriptionRequired?: boolean
  [key: string]: any
}

export interface AvailabilityPharmacy {
  id?: number | string
  statut?: 'disponible' | 'indisponible' | string
  qte?: number
  province?: string
  Province?: string
  provinceName?: string
  region?: string
  adresse?: string
  [key: string]: any
}

export interface AvailabilityResponse {
  disponibilites?: AvailabilityPharmacy[]
  [key: string]: any
}

export interface CartItemModel {
  product: Product
  quantite: number
  pharmacy?: AvailabilityPharmacy
  province?: string
  reservedAt?: string
}
