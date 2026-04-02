// server/api/categories/[id].delete.js
import { getDB } from "../../utils/db";
import { getRouterParam } from "h3";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  try {
    const db = await getDB();
    const categories = db.collection("categories");
    const result = await categories.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "Categoria não encontrada",
      });
    }
    return { message: "Categoria excluída com sucesso" };
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao excluir categoria",
    });
  }
});
