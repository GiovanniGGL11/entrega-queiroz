// server/api/inventory.post.ts
import { getDB } from "../utils/db";
import { ObjectId } from "mongodb";
import { requireAuth } from "../utils/auth-middleware";

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  await requireAuth(event);
  
  const body = await readBody(event);
  const { productId, initialStock, minStock, maxStock, costPrice } = body;

  if (!productId) {
    throw createError({
      statusCode: 400,
      message: "ID do produto é obrigatório",
    });
  }

  if (initialStock === undefined || initialStock < 0) {
    throw createError({
      statusCode: 400,
      message: "Estoque inicial deve ser maior ou igual a zero",
    });
  }

  try {
    const db = await getDB();
    const inventory = db.collection("inventory");
    const products = db.collection("products");
    
    // Verificar se o produto existe
    const product = await products.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      throw createError({
        statusCode: 404,
        message: "Produto não encontrado",
      });
    }
    
    // Verificar se já existe entrada de estoque para este produto
    const existingInventory = await inventory.findOne({ productId: productId });
    if (existingInventory) {
      throw createError({
        statusCode: 409,
        message: "Já existe controle de estoque para este produto",
      });
    }

    const result = await inventory.insertOne({
      productId: productId,
      productName: product.name,
      currentStock: parseInt(initialStock) || 0,
      minStock: parseInt(minStock) || 5,
      maxStock: parseInt(maxStock) || 100,
      costPrice: parseFloat(costPrice) || 0,
      totalSold: 0,
      totalPurchased: parseInt(initialStock) || 0,
      lastUpdated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return { 
      id: result.insertedId, 
      message: "Controle de estoque criado com sucesso",
      inventory: {
        _id: result.insertedId,
        productId: productId,
        productName: product.name,
        currentStock: parseInt(initialStock) || 0,
        minStock: parseInt(minStock) || 5,
        maxStock: parseInt(maxStock) || 100,
        costPrice: parseFloat(costPrice) || 0,
        totalSold: 0,
        totalPurchased: parseInt(initialStock) || 0,
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao criar controle de estoque" 
    });
  }
});
