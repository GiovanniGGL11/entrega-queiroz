// server/api/orders.get.ts
import { getDB } from "../utils/db";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { status, limit = 50, skip = 0 } = query;

  try {
    const db = await getDB();
    const orders = db.collection("orders");
    
    let filter = {};
    if (status) {
      filter = { status: status };
    }
    
    const ordersList = await orders
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .toArray();
    
    return ordersList;
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar pedidos",
    });
  }
});
