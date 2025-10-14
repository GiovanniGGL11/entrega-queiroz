// server/api/products.post.js
import { getDB } from "../utils/db";
import { readMultipartFormData } from "h3";
import { writeFile } from "fs/promises";
import { join } from "path";
import { ObjectId } from "mongodb";

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  if (!form) {
    throw createError({ statusCode: 400, message: "Dados inválidos" });
  }

  const fields = {};
  let imageFile = null;
  form.forEach((part) => {
    if (part.name === "image") {
      imageFile = part;
    } else {
      fields[part.name] = part.data.toString();
    }
  });

  const { name, description, price, categoryId } = fields;
  if (!name || !description || !price || !categoryId || !imageFile) {
    throw createError({
      statusCode: 400,
      message: "Todos os campos são obrigatórios",
    });
  }

  try {
    // Upload imagem para /public/uploads/
    const filename = `${Date.now()}-${imageFile.filename}`;
    const filepath = join(process.cwd(), "public", "uploads", filename);
    await writeFile(filepath, imageFile.data);

    const db = await getDB();
    const products = db.collection("products");
    const result = await products.insertOne({
      name,
      description,
      price: parseFloat(price),
      categoryId: new ObjectId(categoryId),
      image: filename,
      createdAt: new Date(),
    });
    return { id: result.insertedId, message: "Produto criado com sucesso" };
  } catch (err) {
    throw createError({ statusCode: 500, message: "Erro ao criar produto" });
  }
});
