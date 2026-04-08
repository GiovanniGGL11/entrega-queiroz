// server/api/categories-with-products.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async () => {
  try {
    const db = await getDB();
    
    const categories = db.collection("categories");
    const products = db.collection("products");
    
    // OTIMIZAÇÃO: Usar aggregation para fazer join e reduzir queries (com timeout)
    const categoriesWithProducts = await categories.aggregate([
      {
        $match: {
          isVisible: { $ne: false } // Inclui categorias com isVisible: true ou undefined
        }
      },
      {
        $lookup: {
          from: "products",
          let: { 
            categoryId: "$_id", // ObjectId original
            categoryIdStr: { $toString: "$_id" } // String para comparação
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    // Comparar ObjectId com ObjectId (se categoryId do produto for ObjectId)
                    { $eq: ["$categoryId", "$$categoryId"] },
                    // Comparar string com string (se categoryId do produto for string)
                    { $eq: [{ $toString: "$categoryId" }, "$$categoryIdStr"] }
                  ]
                },
                isVisible: { $ne: false } // Apenas produtos visíveis
              }
            },
            {
              $project: {
                id: { $toString: "$_id" },
                _id: { $toString: "$_id" }, // Adicionar _id como string também
                name: 1,
                description: 1,
                price: 1,
                image: 1,
                complements: 1,
                isVisible: 1,
                promotion: 1
              }
            },
            { $sort: { order: 1, createdAt: -1 } }
          ],
          as: "items"
        }
      },
      {
        $project: {
          _id: { $toString: "$_id" }, // Converter _id para string
          id: { $toString: "$_id" }, // Adicionar id como string
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
    ], {
      maxTimeMS: 10000 // Timeout de 10 segundos
    }).toArray();
    
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
