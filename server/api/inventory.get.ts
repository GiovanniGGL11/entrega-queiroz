// server/api/inventory.get.ts
import { getDB } from "../utils/db";
import { verifyUserToken } from "../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
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
  const query = getQuery(event);
  const { productId, lowStock } = query;

  try {
    const db = await getDB();
    const inventory = db.collection("inventory");
    const products = db.collection("products");
    
    let filter = {};
    if (productId) {
      filter = { productId: productId };
    }
    
    // Se solicitado apenas produtos com estoque baixo
    if (lowStock === 'true') {
      filter = { ...filter, currentStock: { $lte: 10 } };
    }
    
    // OTIMIZAÇÃO: Usar aggregation para fazer join e reduzir queries
    const inventoryItems = await inventory.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          productId: 1,
          currentStock: 1,
          minStock: 1,
          maxStock: 1,
          costPrice: 1,
          createdAt: 1,
          updatedAt: 1,
          product: {
            name: "$product.name",
            image: "$product.image",
            price: "$product.price",
            categoryId: "$product.categoryId"
          }
        }
      },
      { $sort: { "product.name": 1 } }
    ]).toArray();
    
    return inventoryItems;
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar estoque",
    });
  }
});
