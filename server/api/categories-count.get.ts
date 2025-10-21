// server/api/categories-count.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async () => {
  try {
    const db = await getDB();
    const products = db.collection("products");
    
    // Agrupar produtos por categoryId e contar
    const pipeline = [
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 }
        }
      }
    ];
    
    const result = await products.aggregate(pipeline).toArray();
    
    // Converter para objeto com categoryId como chave
    const counts = {};
    result.forEach(item => {
      // Usar string vazia para null/undefined
      const categoryId = item._id || '';
      counts[categoryId] = item.count;
    });
    
    console.log('Contagem de produtos por categoria:', counts);
    
    return counts;
  } catch (err) {
    console.error('Erro ao contar produtos por categoria:', err);
    throw createError({
      statusCode: 500,
      message: "Erro ao contar produtos por categoria",
    });
  }
});
