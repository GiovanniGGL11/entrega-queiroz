// server/api/categories.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { showAll = false } = query;

  try {
    const db = await getDB();
    const categories = db.collection("categories");
    
    let filter = {};
    // Se showAll não for true, filtrar apenas categorias visíveis
    if (showAll !== 'true') {
      filter.isVisible = { $ne: false }; // Inclui categorias com isVisible: true ou undefined
    }
    
    const allCategories = await categories.find(filter).sort({ order: 1, createdAt: -1 }).toArray();
    return allCategories;
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar categorias",
    });
  }
});
