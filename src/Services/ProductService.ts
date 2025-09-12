// src/service/ProductService.ts
import { fetchApi } from '@/utils/api'
import { joinUrl } from '@/utils/url'
export type Product = {
  id: number;

  libelle: string;
  forme: string;
  nature: string;
  categorie: string;
  classe_therapeutique: string;
  dci: string;
  code_table: string;
  code: string;
  statut: string;
  rayon: string;
  css: string;

  prix_achat: number;
  prix_de_vente: number;
  coef_conversion_de_prix_vente_achat: number;
  tva: string;

  cip: number;
  cip_deux: number;
  qte: number;

  hauteur: number;
  largeur: number;
  longueur: number;
  poids: number;

  created_at: string; // ISO date (ex: 2025-08-18T13:35:38.479Z)
  updated_at: string; // ISO date
  /**
   * Optionnel: statut d'inventaire utilisé par la vue de liste (squelette PrimeVue)
   */
  inventoryStatus?: 'INSTOCK' | 'LOWSTOCK' | 'OUTOFSTOCK';
};

export class ProductService {
  static async getProductsSmall(): Promise<Product[]> {
    // Récupération via API réelle (fallback géré par fetchApi)
    const path = joinUrl('api_epg', 'all_products', '1', '10')
    const res = await fetchApi(path)
    if (!res.ok) throw new Error('Erreur de chargement produits');
    return await res.json();
  }

  static async getProducts(): Promise<Product[]> {
    // JSON statique local (depuis public/data)
    const res = await fetch('/data/products-small.json');
    if (!res.ok) throw new Error('Erreur de chargement produits');
    return await res.json();
  }
}
