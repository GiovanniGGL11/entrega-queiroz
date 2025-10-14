// server/api/categories-with-products.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async () => {
  try {
    const db = await getDB();
    const categories = db.collection("categories");
    const products = db.collection("products");
    
    // Buscar todas as categorias
    const allCategories = await categories.find({}).sort({ order: 1, createdAt: -1 }).toArray();
    
    // Para cada categoria, buscar seus produtos
    const categoriesWithProducts = await Promise.all(
      allCategories.map(async (category: any) => {
        const categoryProducts = await products.find({ 
          categoryId: category._id.toString() 
        }).sort({ order: 1, createdAt: -1 }).toArray();
        
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
    
    return categoriesWithProducts;
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar categorias com produtos",
    });
  }
});
