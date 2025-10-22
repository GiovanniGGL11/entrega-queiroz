// server/api/categories-with-products.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async () => {
  try {
    const db = await getDB();
    
    const categories = db.collection("categories");
    const products = db.collection("products");
    
    // OTIMIZAÇÃO: Usar aggregation para fazer join e reduzir queries
    const categoriesWithProducts = await categories.aggregate([
      {
        $match: {
          isVisible: { $ne: false } // Inclui categorias com isVisible: true ou undefined
        }
      },
      {
        $lookup: {
          from: "products",
          let: { categoryId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$categoryId", "$$categoryId"] },
                isVisible: { $ne: false } // Apenas produtos visíveis
              }
            },
            {
              $project: {
                id: { $toString: "$_id" },
                name: 1,
                description: 1,
                price: 1,
                image: 1,
                complements: 1
              }
            },
            { $sort: { order: 1, createdAt: -1 } }
          ],
          as: "items"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          order: 1,
          isVisible: 1,
          createdAt: 1,
          items: 1
        }
      },
      { $sort: { order: 1, createdAt: -1 } }
    ]).toArray();
    
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
