// server/api/inventory/movements.post.ts
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
import { verifyUserToken } from "../../utils/auth";
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
  
  const body = await readBody(event);
  const { inventoryId, type, quantity, reason, costPrice, notes } = body;

  if (!inventoryId || !type || !quantity) {
    throw createError({
      statusCode: 400,
      message: "ID do estoque, tipo e quantidade são obrigatórios",
    });
  }

  const validTypes = ['entrada', 'saida', 'ajuste', 'perda', 'transferencia'];
  if (!validTypes.includes(type)) {
    throw createError({
      statusCode: 400,
      message: "Tipo de movimentação inválido",
    });
  }

  const qty = parseInt(quantity);
  if (qty <= 0) {
    throw createError({
      statusCode: 400,
      message: "Quantidade deve ser maior que zero",
    });
  }

  try {
    const db = await getDB();
    const inventory = db.collection("inventory");
    const movements = db.collection("inventory_movements");
    
    // Verificar se o item de estoque existe
    const inventoryItem = await inventory.findOne({ _id: new ObjectId(inventoryId) });
    if (!inventoryItem) {
      throw createError({
        statusCode: 404,
        message: "Item de estoque não encontrado",
      });
    }

    let newStock = inventoryItem.currentStock;
    let updateFields = {};

    // Calcular novo estoque baseado no tipo de movimentação
    switch (type) {
      case 'entrada':
        newStock += qty;
        updateFields.totalPurchased = inventoryItem.totalPurchased + qty;
        break;
      case 'saida':
        if (inventoryItem.currentStock < qty) {
          throw createError({
            statusCode: 400,
            message: "Estoque insuficiente",
          });
        }
        newStock -= qty;
        updateFields.totalSold = inventoryItem.totalSold + qty;
        break;
      case 'ajuste':
        newStock = qty;
        break;
      case 'perda':
        if (inventoryItem.currentStock < qty) {
          throw createError({
            statusCode: 400,
            message: "Estoque insuficiente para perda",
          });
        }
        newStock -= qty;
        break;
      case 'transferencia':
        if (inventoryItem.currentStock < qty) {
          throw createError({
            statusCode: 400,
            message: "Estoque insuficiente para transferência",
          });
        }
        newStock -= qty;
        break;
    }

    // Atualizar estoque
    updateFields.currentStock = newStock;
    updateFields.lastUpdated = new Date();
    updateFields.updatedAt = new Date();

    await inventory.updateOne(
      { _id: new ObjectId(inventoryId) },
      { $set: updateFields }
    );

    // Registrar movimentação
    const movement = {
      inventoryId: new ObjectId(inventoryId),
      productId: inventoryItem.productId,
      productName: inventoryItem.productName,
      type: type,
      quantity: qty,
      previousStock: inventoryItem.currentStock,
      newStock: newStock,
      reason: reason || '',
      costPrice: costPrice || inventoryItem.costPrice,
      notes: notes || '',
      createdAt: new Date(),
      createdBy: 'system' // Em um sistema real, seria o ID do usuário
    };

    const movementResult = await movements.insertOne(movement);

    // Buscar item atualizado
    const updatedItem = await inventory.findOne({ _id: new ObjectId(inventoryId) });

    return {
      success: true,
      message: "Movimentação registrada com sucesso",
      movement: {
        _id: movementResult.insertedId,
        ...movement
      },
      inventory: updatedItem
    };

  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({
      statusCode: 500,
      message: "Erro ao registrar movimentação de estoque",
    });
  }
});
