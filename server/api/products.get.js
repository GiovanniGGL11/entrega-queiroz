// server/api/products/products.get.js
import { getDB } from "../utils/db"; // Assumindo seu utilit
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    const db = await getDB();
    const collection = db.collection("products");

    // Lógica de agregação para incluir o nome da categoria (conforme sua documentação)
    const productsWithCategories = await collection
      .aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            image: 1,
            categoryId: 1,
            categoryName: "$categoryInfo.name", // Pega o nome da categoria
            createdAt: 1,
          },
        },
      ])
      .toArray();

    return productsWithCategories;
  } catch (error) {
    console.error("Erro no handler /api/products:", error);
    throw createError({
      statusCode: 500,
      message: "Falha ao buscar produtos.",
    });
  }
});
