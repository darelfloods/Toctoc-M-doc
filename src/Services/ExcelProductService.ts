// src/Services/ExcelProductService.ts
import * as XLSX from 'xlsx'
import type { Product } from './ProductService'

export class ExcelProductService {
  private static products: Product[] = []
  private static isLoaded = false

  static async loadProductsFromExcel(): Promise<Product[]> {
    if (this.isLoaded && this.products.length > 0) {
      return this.products
    }

    try {
      // Fetch the Excel file from the public folder
      const response = await fetch('/db/BASE DE DONNEES EPHARMA2024 OK (1).xlsx')
      if (!response.ok) {
        throw new Error(`Failed to fetch Excel file: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      // Get the first worksheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (rawData.length === 0) {
        throw new Error('Excel file is empty')
      }

      // Get headers from first row
      const headers = rawData[0] as string[]

      // Convert data rows to Product objects
      this.products = rawData.slice(1).map((row, index) => {
        const product: Partial<Product> = {
          id: index + 1, // Generate sequential ID
        }

        // Map Excel columns to Product properties
        headers.forEach((header, colIndex) => {
          const value = row[colIndex]
          const normalizedHeader = header?.toLowerCase().trim()

          switch (normalizedHeader) {
            case 'libelle':
            case 'libellé':
            case 'nom':
            case 'produit':
              product.libelle = String(value || '')
              break
            case 'forme':
              product.forme = String(value || '')
              break
            case 'nature':
              product.nature = String(value || '')
              break
            case 'categorie':
            case 'catégorie':
              product.categorie = String(value || '')
              break
            case 'classe_therapeutique':
            case 'classe thérapeutique':
            case 'classe':
              product.classe_therapeutique = String(value || '')
              break
            case 'dci':
              product.dci = String(value || '')
              break
            case 'code_table':
            case 'code table':
              product.code_table = String(value || '')
              break
            case 'code':
              product.code = String(value || '')
              break
            case 'statut':
              product.statut = String(value || '')
              break
            case 'rayon':
              product.rayon = String(value || '')
              break
            case 'css':
              product.css = String(value || '')
              break
            case 'prix_achat':
            case 'prix achat':
              product.prix_achat = Number(value) || 0
              break
            case 'prix_de_vente':
            case 'prix de vente':
            case 'prix_vente':
              product.prix_de_vente = Number(value) || 0
              break
            case 'coef_conversion_de_prix_vente_achat':
            case 'coefficient':
              product.coef_conversion_de_prix_vente_achat = Number(value) || 0
              break
            case 'tva':
              product.tva = String(value || '')
              break
            case 'cip':
              product.cip = Number(value) || 0
              break
            case 'cip_deux':
            case 'cip2':
              product.cip_deux = Number(value) || 0
              break
            case 'qte':
            case 'quantité':
            case 'stock':
              product.qte = Number(value) || 0
              break
            case 'hauteur':
              product.hauteur = Number(value) || 0
              break
            case 'largeur':
              product.largeur = Number(value) || 0
              break
            case 'longueur':
              product.longueur = Number(value) || 0
              break
            case 'poids':
              product.poids = Number(value) || 0
              break
          }
        })

        // Set default values for required fields
        return {
          id: product.id || index + 1,
          libelle: product.libelle || '',
          forme: product.forme || '',
          nature: product.nature || '',
          categorie: product.categorie || '',
          classe_therapeutique: product.classe_therapeutique || '',
          dci: product.dci || '',
          code_table: product.code_table || '',
          code: product.code || '',
          statut: product.statut || '',
          rayon: product.rayon || '',
          css: product.css || '',
          prix_achat: product.prix_achat || 0,
          prix_de_vente: product.prix_de_vente || 0,
          coef_conversion_de_prix_vente_achat: product.coef_conversion_de_prix_vente_achat || 0,
          tva: product.tva || '',
          cip: product.cip || 0,
          cip_deux: product.cip_deux || 0,
          qte: product.qte || 0,
          hauteur: product.hauteur || 0,
          largeur: product.largeur || 0,
          longueur: product.longueur || 0,
          poids: product.poids || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          inventoryStatus: product.qte && product.qte > 10 ? 'INSTOCK' :
                          product.qte && product.qte > 0 ? 'LOWSTOCK' : 'OUTOFSTOCK'
        } as Product
      }).filter(product => product.libelle) // Filter out products without names

      this.isLoaded = true
      console.log(`[ExcelProductService] Loaded ${this.products.length} products from Excel`)
      return this.products

    } catch (error) {
      console.error('[ExcelProductService] Error loading Excel file:', error)
      throw new Error(`Failed to load products from Excel: ${error}`)
    }
  }

  static async getProducts(): Promise<Product[]> {
    return this.loadProductsFromExcel()
  }

  static async getProductsSmall(): Promise<Product[]> {
    const products = await this.loadProductsFromExcel()
    return products.slice(0, 10) // Return first 10 products
  }

  static async searchProducts(term: string): Promise<Product[]> {
    const products = await this.loadProductsFromExcel()
    const searchTerm = term.toLowerCase().trim()

    if (!searchTerm) {
      return products.slice(0, 20) // Return first 20 if no search term
    }

    return products.filter(product =>
      product.libelle.toLowerCase().includes(searchTerm) ||
      product.dci.toLowerCase().includes(searchTerm) ||
      product.code.toLowerCase().includes(searchTerm) ||
      product.cip.toString().includes(searchTerm)
    )
  }

  static async getProductByCip(cip: string | number): Promise<Product | null> {
    const products = await this.loadProductsFromExcel()
    const cipStr = String(cip)
    return products.find(product =>
      product.cip.toString() === cipStr ||
      product.cip_deux.toString() === cipStr
    ) || null
  }

  static clearCache(): void {
    this.products = []
    this.isLoaded = false
  }
}