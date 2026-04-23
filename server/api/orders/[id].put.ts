// server/api/orders/[id].put.ts
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';
import { notifyOrderStatus } from "../../utils/whatsapp";

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
  
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { status, notes, motoboyId, motoboyNome } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do pedido é obrigatório",
    });
  }

  if (!status) {
    throw createError({
      statusCode: 400,
      message: "Status é obrigatório",
    });
  }

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      message: "Status inválido",
    });
  }

  try {

    const db = await getDB();
    const orders = db.collection("orders");

    const updateData: any = {
      status: status,
      updatedAt: new Date()
    };

    if (notes !== undefined) {
      updateData.notes = notes.trim();
    }
    if (motoboyId !== undefined) {
      updateData.motoboyId = motoboyId;
      updateData.motoboyNome = motoboyNome || '';
    }
    const result = await orders.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "Pedido não encontrado",
      });
    }

    // Buscar o pedido atualizado
    const updatedOrder = await orders.findOne({ _id: new ObjectId(id) });

    // Notificar cliente via WhatsApp (só executa se WHATSAPP_ENABLED=true)
    notifyOrderStatus(updatedOrder, status).catch(err =>
      console.error('[WhatsApp] Falha ao notificar status:', err)
    )

    // Débito automático de estoque quando pedido é confirmado
    // Restaura estoque quando cancelado (apenas se veio de um status ativo)
    if (status === 'confirmed' || status === 'cancelled') {
      try {
        const inventory = db.collection('inventory')
        const movements = db.collection('inventory_movements')
        const products = db.collection('products')
        const orderItems = updatedOrder?.items || []
        const prevStatus = updatedOrder?.status
        const activeStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery']

        // Helper para debitar/restaurar um item de inventário
        const adjustStock = async (invItem: any, qty: number, isDebit: boolean, reason: string) => {
          const previousStock = invItem.currentStock ?? 0
          const newStock = isDebit ? Math.max(0, previousStock - qty) : previousStock + qty
          await inventory.updateOne({ _id: invItem._id }, { $set: { currentStock: newStock, updatedAt: new Date() } })
          await movements.insertOne({
            inventoryId: invItem._id,
            itemName: invItem.name,
            category: invItem.category,
            type: isDebit ? 'saida' : 'entrada',
            quantity: qty,
            previousStock,
            newStock,
            reason,
            createdAt: new Date()
          })
        }

        for (const item of orderItems) {
          if (!item.productId) continue
          const orderQty = item.quantity || 1
          const removedIngredients: string[] = item.removedIngredients || []

          // 1. Débito do produto em si (tipo 'produto' vinculado ao cardápio)
          const invItem = await inventory.findOne({ productId: item.productId, type: 'produto' })
          if (invItem) {
            if (status === 'confirmed') {
              await adjustStock(invItem, orderQty, true, `Venda — Pedido #${updatedOrder?.orderNumber}`)
            } else if (status === 'cancelled' && activeStatuses.includes(prevStatus)) {
              await adjustStock(invItem, orderQty, false, `Cancelamento — Pedido #${updatedOrder?.orderNumber}`)
            }
          }

          // 2. Débito dos ingredientes da receita do produto
          const product = await products.findOne({ _id: new (await import('mongodb')).ObjectId(item.productId) })
          const recipe: any[] = product?.recipe || []

          for (const ingredient of recipe) {
            // Pular ingrediente removido pelo cliente
            if (removedIngredients.includes(ingredient.inventoryId)) continue

            const ingItem = await inventory.findOne({ _id: new (await import('mongodb')).ObjectId(ingredient.inventoryId) })
            if (!ingItem) continue

            const ingQty = (ingredient.quantity || 1) * orderQty

            if (status === 'confirmed') {
              await adjustStock(ingItem, ingQty, true, `Ingrediente — Pedido #${updatedOrder?.orderNumber} (${item.name})`)
            } else if (status === 'cancelled' && activeStatuses.includes(prevStatus)) {
              await adjustStock(ingItem, ingQty, false, `Cancelamento ingrediente — Pedido #${updatedOrder?.orderNumber}`)
            }
          }
        }
      } catch (invErr) {
        console.error('[Inventory] Falha ao atualizar estoque:', invErr)
      }
    }

    // Notificar dashboard via SSE para atualizar stats em tempo real
    try {
      const { notifyStatusChange } = await import('../../utils/sse-notifications.js')
      await notifyStatusChange(id, updatedOrder?.orderNumber, status)
    } catch (err) {
      console.error('[SSE] Falha ao notificar status change:', err)
    }

    return {
      success: true,
      message: "Pedido atualizado com sucesso",
      order: updatedOrder
    };
  } catch (err: any) {
    console.error('Erro na API de atualização de pedido:', err);
    if (err.statusCode) {
      throw err;
    }
    throw createError({
      statusCode: 500,
      message: "Erro ao atualizar pedido"
    });
  }
});
