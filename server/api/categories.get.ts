// server/api/categories.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async () => {
  try {
    const db = await getDB();
    const categories = db.collection("categories");
    const allCategories = await categories.find({}).sort({ order: 1, createdAt: -1 }).toArray();
    return allCategories;
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar categorias",
    });
  }
});
