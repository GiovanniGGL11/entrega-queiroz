// server/api/products/[id].delete.js
import { getDB } from "../../utils/db";
import { getRouterParam } from "h3";
import { unlink } from "fs/promises";
import { join } from "path";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  try {
    const db = await getDB();
    const products = db.collection("products");
    const product = await products.findOne({ _id: new ObjectId(id) });
    if (!product) {
      throw createError({ statusCode: 404, message: "Produto não encontrado" });
    }

    // Deleta imagem
    if (product.image) {
      const filepath = join(process.cwd(), "public", "uploads", product.image);
      await unlink(filepath).catch(() => {}); // Ignora se não existir
    }

    await products.deleteOne({ _id: new ObjectId(id) });
    return { message: "Produto excluído com sucesso" };
  } catch (err) {
    throw createError({ statusCode: 500, message: "Erro ao excluir produto" });
  }
});
