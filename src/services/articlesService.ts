/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface Article {
  id: string;
  company_id: string;
  reference: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  tva_rate: number;
  stock_quantity: number;
  stock_min: number;
  stock_max?: number;
  warehouse_id?: string;
  supplier_id?: string;
  supplier_reference?: string;
  purchase_account_id?: string;
  sales_account_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface ArticleWithRelations extends Article {
  warehouse_name?: string;
  supplier_name?: string;
  purchase_account_number?: string;
  sales_account_number?: string;
}
export interface CreateArticleInput {
  reference: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  tva_rate: number;
  stock_quantity: number;
  stock_min: number;
  stock_max?: number;
  warehouse_id: string;
  supplier_id?: string;
  supplier_reference?: string;
  purchase_account_id?: string;
  sales_account_id?: string;
}
export interface UpdateArticleInput {
  reference?: string;
  barcode?: string;
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  purchase_price?: number;
  selling_price?: number;
  tva_rate?: number;
  stock_quantity?: number;
  stock_min?: number;
  stock_max?: number;
  warehouse_id?: string;
  supplier_id?: string;
  supplier_reference?: string;
  purchase_account_id?: string;
  sales_account_id?: string;
  is_active?: boolean;
}
export interface ArticleFilters {
  category?: string;
  warehouse_id?: string;
  supplier_id?: string;
  search?: string;
  is_active?: boolean;
}
class ArticlesService {
  /**
   * Get all articles for a company
   */
  async getArticles(companyId: string, filters?: ArticleFilters): Promise<ArticleWithRelations[]> {
    logger.debug('📦 [articlesService] getArticles called with companyId:', companyId);
    logger.debug('📦 [articlesService] filters:', filters);

    let query = supabase
      .from('articles')
      .select(`
        *,
        warehouses:warehouse_id (name),
        supplier:suppliers(name),
        purchase_account:purchase_account_id (account_number),
        sales_account:sales_account_id (account_number)
      `)
      .eq('company_id', companyId);
    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id);
    }
    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
    }
    query = query.order('name', { ascending: true });
    const { data, error } = await query;

    logger.debug('📦 [articlesService] Query result - data count:', data?.length || 0);
    logger.debug('📦 [articlesService] Query result - error:', error);
    if (error) {
      console.error('❌ [articlesService] FULL ERROR OBJECT:', JSON.stringify(error, null, 2));
      logger.error('Articles', 'Error fetching articles:', error);
      throw error;
    }
    // Transform data with relations
    return (data || []).map(article => ({
      ...article,
      warehouse_name: article.warehouses?.name,
      supplier_name: article.supplier?.name,
      purchase_account_number: article.purchase_account?.account_number,
      sales_account_number: article.sales_account?.account_number
    }));
  }
  /**
   * Get article by ID
   */
  async getArticleById(articleId: string): Promise<ArticleWithRelations | null> {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        warehouses:warehouse_id (name),
        supplier:suppliers(name),
        purchase_account:purchase_account_id (account_number),
        sales_account:sales_account_id (account_number)
      `)
      .eq('id', articleId)
      .single();
    if (error) {
      logger.error('Articles', 'Error fetching article:', error);
      return null;
    }
    return {
      ...data,
      warehouse_name: data.warehouses?.name,
      supplier_name: data.supplier?.name,
      purchase_account_number: data.purchase_account?.account_number,
      sales_account_number: data.sales_account?.account_number
    };
  }
  /**
   * Get article by reference
   */
  async getArticleByReference(companyId: string, reference: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('company_id', companyId)
      .eq('reference', reference)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Articles', 'Error fetching article by reference:', error);
      throw error;
    }
    return data;
  }
  /**
   * Create a new article
   */
  async createArticle(companyId: string, articleData: CreateArticleInput): Promise<Article> {
    logger.debug('🔧 [articlesService.createArticle] Called with:');
    logger.debug('  - companyId:', companyId);
    logger.debug('  - articleData:', articleData);

    // Check if reference already exists
    logger.debug('🔍 Checking if reference already exists:', articleData.reference);
    const existingArticle = await this.getArticleByReference(companyId, articleData.reference);
    if (existingArticle) {
      console.error('❌ Reference already exists:', existingArticle.id);
      throw new Error(`Un article avec la référence "${articleData.reference}" existe déjà`);
    }
    logger.debug('✅ Reference is unique');

    const dataToInsert = {
      company_id: companyId,
      ...articleData,
      is_active: true
    };

    logger.debug('💾 Inserting article into database:', dataToInsert);

    const { data, error } = await supabase
      .from('articles')
      .insert(dataToInsert)
      .select()
      .single();

    logger.debug('📤 Database response:');
    logger.debug('  - data:', data);
    logger.debug('  - error:', error);

    if (error) {
      console.error('❌ Database error:', JSON.stringify(error, null, 2));
      logger.error('Articles', 'Error creating article:', error);
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('barcode')) {
          throw new Error('Ce code-barres est déjà utilisé');
        }
        throw new Error('Cet article existe déjà');
      }
      throw error;
    }

    logger.debug('✅ Article created successfully:', data.id);
    return data;
  }
  /**
   * Update article
   */
  async updateArticle(articleId: string, updates: UpdateArticleInput): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', articleId)
      .select()
      .single();
    if (error) {
      logger.error('Articles', 'Error updating article:', error);
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('barcode')) {
          throw new Error('Ce code-barres est déjà utilisé');
        }
        if (error.message.includes('reference')) {
          throw new Error('Cette référence est déjà utilisée');
        }
        throw new Error('Conflit de données');
      }
      throw error;
    }
    return data;
  }
  /**
   * Delete article (soft delete)
   */
  async deleteArticle(articleId: string): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .update({ is_active: false })
      .eq('id', articleId);
    if (error) {
      logger.error('Articles', 'Error deleting article:', error);
      throw error;
    }
  }
  /**
   * Update article stock quantity
   */
  async updateStock(articleId: string, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set'): Promise<Article> {
    if (operation === 'set') {
      return this.updateArticle(articleId, { stock_quantity: quantity });
    }
    // For add/subtract, we need to get current stock first
    const article = await this.getArticleById(articleId);
    if (!article) {
      throw new Error('Article non trouvé');
    }
    let newQuantity = article.stock_quantity;
    if (operation === 'add') {
      newQuantity += quantity;
    } else if (operation === 'subtract') {
      newQuantity -= quantity;
    }
    // Ensure stock doesn't go negative
    if (newQuantity < 0) {
      throw new Error('Le stock ne peut pas être négatif');
    }
    return this.updateArticle(articleId, { stock_quantity: newQuantity });
  }
  /**
   * Get low stock articles
   */
  async getLowStockArticles(companyId: string): Promise<ArticleWithRelations[]> {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        warehouses:warehouse_id (name),
        supplier:suppliers(name)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .filter('stock_quantity', 'lte', supabase.rpc('stock_min'))
      .order('stock_quantity', { ascending: true });
    if (error) {
      logger.error('Articles', 'Error fetching low stock articles:', error);
      throw error;
    }
    return (data || []).map(article => ({
      ...article,
      warehouse_name: article.warehouses?.name,
      supplier_name: article.supplier?.name
    }));
  }
  /**
   * Get articles by category
   */
  async getArticlesByCategory(companyId: string, category: string): Promise<ArticleWithRelations[]> {
    return this.getArticles(companyId, { category, is_active: true });
  }
  /**
   * Get articles by warehouse
   */
  async getArticlesByWarehouse(companyId: string, warehouseId: string): Promise<ArticleWithRelations[]> {
    return this.getArticles(companyId, { warehouse_id: warehouseId, is_active: true });
  }
  /**
   * Get articles by supplier
   */
  async getArticlesBySupplier(companyId: string, supplierId: string): Promise<ArticleWithRelations[]> {
    return this.getArticles(companyId, { supplier_id: supplierId, is_active: true });
  }
  /**
   * Search articles
   */
  async searchArticles(companyId: string, searchTerm: string): Promise<ArticleWithRelations[]> {
    return this.getArticles(companyId, { search: searchTerm, is_active: true });
  }
  /**
   * Get article statistics
   */
  async getArticleStats(companyId: string): Promise<{
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  }> {
    const articles = await this.getArticles(companyId, { is_active: true });
    const stats = {
      total: articles.length,
      active: articles.filter(a => a.is_active).length,
      lowStock: articles.filter(a => a.stock_quantity <= a.stock_min).length,
      outOfStock: articles.filter(a => a.stock_quantity === 0).length,
      totalValue: articles.reduce((sum, a) => sum + (a.stock_quantity * a.purchase_price), 0)
    };
    return stats;
  }
}
export const articlesService = new ArticlesService();
export default articlesService;