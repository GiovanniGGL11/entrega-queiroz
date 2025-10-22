// server/api/orders.get.ts
import { getDB } from "../utils/db";
import { requireAuth } from "../utils/auth-middleware";
import { getRequestHeader, getCookie } from 'h3';

export default defineEventHandler(async (event) => {
  // Debug logs para produção
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 [ORDERS] Endpoint chamado')
    
    // Verificar headers
    const authHeader = getRequestHeader(event, 'authorization')
    console.log('🔍 [ORDERS] Authorization header:', authHeader ? 'present' : 'missing')
    if (authHeader) {
      console.log('🔍 [ORDERS] Authorization header value:', authHeader)
    }
    
    // Verificar cookies
    const cookies = getCookie(event, 'auth_token')
    console.log('🔍 [ORDERS] Auth cookie:', cookies ? 'present' : 'missing')
  }
  
  // Verificar autenticação
  await requireAuth(event);
  
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
