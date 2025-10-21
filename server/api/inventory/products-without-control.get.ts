// server/api/inventory/products-without-control.get.ts
import { getDB } from "../../utils/db";
import { requireAuth } from "../../utils/auth-middleware";

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  await requireAuth(event);
  
  try {
    const db = await getDB();
    const products = db.collection("products");
    const inventory = db.collection("inventory");

    // Buscar todos os produtos
    const allProducts = await products.find({}).toArray();
    
    // Buscar produtos que já têm controle de estoque
    const productsWithInventory = await inventory.find({}).toArray();
    const controlledProductIds = productsWithInventory.map(item => item.productId.toString());

    // Filtrar produtos sem controle de estoque
    const productsWithoutControl = allProducts.filter(product => 
      !controlledProductIds.includes(product._id.toString())
    );

    // Enriquecer com informações da categoria
    const categories = db.collection("categories");
    const enrichedProducts = await Promise.all(
      productsWithoutControl.map(async (product) => {
        const category = await categories.findOne({ _id: product.categoryId });
        return {
          ...product,
          category: category ? {
            name: category.name,
            color: category.color
          } : null
        };
      })
    );

    return {
      products: enrichedProducts,
      total: enrichedProducts.length
    };

  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar produtos sem controle de estoque",
    });
  }
});
