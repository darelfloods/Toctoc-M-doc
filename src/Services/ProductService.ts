// src/service/ProductService.ts
import { fetchApi } from '@/utils/api'
import { joinUrl } from '@/utils/url'
import { ExcelProductService } from './ExcelProductService'
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
    // Récupération depuis fichier Excel local
    return await ExcelProductService.getProductsSmall();
  }

  static async getProducts(): Promise<Product[]> {
    // Récupération depuis fichier Excel local
    return await ExcelProductService.getProducts();
  }

  static async searchProducts(term: string): Promise<Product[]> {
    // Recherche dans le fichier Excel local
    return await ExcelProductService.searchProducts(term);
  }

  static async getProductByCip(cip: string | number): Promise<Product | null> {
    // Recherche par CIP dans le fichier Excel local
    return await ExcelProductService.getProductByCip(cip);
  }
}
