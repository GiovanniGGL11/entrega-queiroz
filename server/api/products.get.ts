// server/api/products.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { categoryId, showAll = false } = query;

  try {
    const db = await getDB();
    const products = db.collection("products");
    
    let filter = {};
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    
    // Se showAll não for true, filtrar apenas produtos visíveis
    if (showAll !== 'true') {
      filter.isVisible = { $ne: false }; // Inclui produtos com isVisible: true ou undefined
    }
    
    const allProducts = await products.find(filter).sort({ order: 1, createdAt: -1 }).toArray();
    return allProducts;
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar produtos",
    });
  }
});
