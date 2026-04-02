// server/api/products.get.js
import { getDB } from "../utils/db";

export default defineEventHandler(async () => {
  try {
    const db = await getDB();
    const products = db.collection("products");
    const allProducts = await products
      .aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            categoryName: "$category.name",
            image: { $concat: ["/uploads/", "$image"] }, // Assume storage local
          },
        },
      ])
      .toArray();
    return allProducts;
  } catch (err) {
    throw createError({ statusCode: 500, message: "Erro ao buscar produtos" });
  }
});
