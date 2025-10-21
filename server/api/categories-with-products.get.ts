// server/api/categories-with-products.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async () => {
  try {
    console.log('[categories-with-products] Iniciando busca...');
    
    const db = await getDB();
    console.log('[categories-with-products] Conexão com DB estabelecida');
    
    const categories = db.collection("categories");
    const products = db.collection("products");
    
    // Buscar apenas categorias visíveis
    const allCategories = await categories.find({ 
      isVisible: { $ne: false } // Inclui categorias com isVisible: true ou undefined
    }).sort({ order: 1, createdAt: -1 }).toArray();
    console.log('[categories-with-products] Categorias visíveis encontradas:', allCategories.length);
    
    // Para cada categoria, buscar seus produtos visíveis
    const categoriesWithProducts = await Promise.all(
      allCategories.map(async (category: any) => {
        const categoryProducts = await products.find({ 
          categoryId: category._id.toString(),
          isVisible: { $ne: false } // Apenas produtos visíveis
        }).sort({ order: 1, createdAt: -1 }).toArray();
        
        console.log(`[categories-with-products] Categoria "${category.name}": ${categoryProducts.length} produtos visíveis`);
        
        return {
          ...category,
          items: categoryProducts.map((product: any) => ({
            id: product._id.toString(),
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            complements: product.complements || []
          }))
        };
      })
    );
    
    console.log('[categories-with-products] Retornando', categoriesWithProducts.length, 'categorias visíveis');
    
    return categoriesWithProducts;
  } catch (error: any) {
    console.error("[categories-with-products] ERRO DETALHADO:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    throw createError({
      statusCode: 500,
      message: `Erro ao buscar categorias: ${error.message}`,
      data: {
        errorType: error.name,
        errorCode: error.code,
        details: error.message
      }
    });
  }
});
