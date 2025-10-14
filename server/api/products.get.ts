// server/api/products.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { categoryId } = query;

  try {
    const db = await getDB();
    const products = db.collection("products");
    
    let filter = {};
    if (categoryId) {
      filter = { categoryId: categoryId };
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
