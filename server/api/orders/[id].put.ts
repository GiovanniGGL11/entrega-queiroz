// server/api/orders/[id].put.ts
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
  
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { status, notes } = body;

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
