// server/api/orders/[id].put.ts
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";

export default defineEventHandler(async (event) => {
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

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      message: "Status inválido",
    });
  }

  try {
    console.log('Atualizando pedido:', id, 'para status:', status);

    const db = await getDB();
    const orders = db.collection("orders");

    const updateData: any = {
      status: status,
      updatedAt: new Date()
    };

    if (notes !== undefined) {
      updateData.notes = notes.trim();
    }

    console.log('Dados de atualização:', updateData);
    console.log('ID convertido para ObjectId:', new ObjectId(id));

    const result = await orders.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Resultado da atualização:', result);

    if (result.matchedCount === 0) {
      console.log('Pedido não encontrado com ID:', id);
      throw createError({
        statusCode: 404,
        message: "Pedido não encontrado",
      });
    }

    // Buscar o pedido atualizado
    const updatedOrder = await orders.findOne({ _id: new ObjectId(id) });
    console.log('Pedido atualizado encontrado:', updatedOrder);

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
