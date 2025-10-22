// server/api/inventory/products-without-control.get.ts
import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  // Autenticação direta sem middleware
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token de autenticação necessário'
    })
  }
  
  // Verificar token
  try {
    const decoded = verifyUserToken(token)
    // Token válido, continuar
  } catch (jwtError) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido ou expirado'
    })
  }
  
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
