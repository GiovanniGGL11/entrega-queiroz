// server/api/inventory.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { productId, lowStock } = query;

  try {
    const db = await getDB();
    const inventory = db.collection("inventory");
    
    let filter = {};
    if (productId) {
      filter = { productId: productId };
    }
    
    // Se solicitado apenas produtos com estoque baixo
    if (lowStock === 'true') {
      filter = { ...filter, currentStock: { $lte: 10 } };
    }
    
    const inventoryItems = await inventory.find(filter).sort({ productName: 1 }).toArray();
    
    // Buscar informações dos produtos para enriquecer os dados
    const products = db.collection("products");
    const enrichedItems = await Promise.all(
      inventoryItems.map(async (item) => {
        const product = await products.findOne({ _id: item.productId });
        return {
          ...item,
          product: product ? {
            name: product.name,
            image: product.image,
            price: product.price,
            categoryId: product.categoryId
          } : null
        };
      })
    );
    
    return enrichedItems;
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar estoque",
    });
  }
});
