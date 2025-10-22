// server/api/inventory/sync-orders.post.ts
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
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
  
  const body = await readBody(event);
  const { orderId, action = 'process' } = body; // 'process' ou 'cancel'

  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: "ID do pedido é obrigatório",
    });
  }

  try {
    const db = await getDB();
    const orders = db.collection("orders");
    const inventory = db.collection("inventory");
    const movements = db.collection("inventory_movements");
    
    // Buscar o pedido
    const order = await orders.findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      throw createError({
        statusCode: 404,
        message: "Pedido não encontrado",
      });
    }

    const results = [];
    const movementsToCreate = [];

    // Processar cada item do pedido
    for (const item of order.items) {
      // Buscar controle de estoque do produto
      const inventoryItem = await inventory.findOne({ 
        productId: item.productId 
      });

      if (!inventoryItem) {
        // Se não há controle de estoque, pular este item
        results.push({
          productId: item.productId,
          productName: item.name,
          status: 'skipped',
          message: 'Produto sem controle de estoque'
        });
        continue;
      }

      const quantity = item.quantity;
      let newStock = inventoryItem.currentStock;
      let updateFields = {};

      if (action === 'process') {
        // Processar venda - reduzir estoque
        if (inventoryItem.currentStock < quantity) {
          results.push({
            productId: item.productId,
            productName: item.name,
            status: 'error',
            message: `Estoque insuficiente. Disponível: ${inventoryItem.currentStock}, Necessário: ${quantity}`
          });
          continue;
        }

        newStock = inventoryItem.currentStock - quantity;
        updateFields.currentStock = newStock;
        updateFields.totalSold = inventoryItem.totalSold + quantity;
        updateFields.lastUpdated = new Date();
        updateFields.updatedAt = new Date();

        // Registrar movimentação
        movementsToCreate.push({
          inventoryId: inventoryItem._id,
          productId: inventoryItem.productId,
          productName: inventoryItem.productName,
          type: 'saida',
          quantity: quantity,
          previousStock: inventoryItem.currentStock,
          newStock: newStock,
          reason: 'Venda - Pedido #' + order.orderNumber,
          costPrice: inventoryItem.costPrice,
          notes: `Pedido: ${order.orderNumber}`,
          createdAt: new Date(),
          createdBy: 'system'
        });

      } else if (action === 'cancel') {
        // Cancelar venda - restaurar estoque
        newStock = inventoryItem.currentStock + quantity;
        updateFields.currentStock = newStock;
        updateFields.totalSold = Math.max(0, inventoryItem.totalSold - quantity);
        updateFields.lastUpdated = new Date();
        updateFields.updatedAt = new Date();

        // Registrar movimentação
        movementsToCreate.push({
          inventoryId: inventoryItem._id,
          productId: inventoryItem.productId,
          productName: inventoryItem.productName,
          type: 'entrada',
          quantity: quantity,
          previousStock: inventoryItem.currentStock,
          newStock: newStock,
          reason: 'Cancelamento - Pedido #' + order.orderNumber,
          costPrice: inventoryItem.costPrice,
          notes: `Cancelamento do pedido: ${order.orderNumber}`,
          createdAt: new Date(),
          createdBy: 'system'
        });
      }

      // Atualizar estoque
      await inventory.updateOne(
        { _id: inventoryItem._id },
        { $set: updateFields }
      );

      results.push({
        productId: item.productId,
        productName: item.name,
        status: 'success',
        message: `Estoque atualizado: ${inventoryItem.currentStock} → ${newStock}`,
        previousStock: inventoryItem.currentStock,
        newStock: newStock
      });
    }

    // Registrar todas as movimentações
    if (movementsToCreate.length > 0) {
      await movements.insertMany(movementsToCreate);
    }

    return {
      success: true,
      message: `Pedido ${action === 'process' ? 'processado' : 'cancelado'} com sucesso`,
      orderId: orderId,
      orderNumber: order.orderNumber,
      results: results,
      movementsCreated: movementsToCreate.length
    };

  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({
      statusCode: 500,
      message: "Erro ao sincronizar estoque com pedido",
    });
  }
});
