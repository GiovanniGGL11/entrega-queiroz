// server/api/orders.get.ts
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
  const { status, page = 1, limit = 50, since } = query;

  try {
    const db = await getDB();
    const orders = db.collection("orders");
    
    // OTIMIZAÇÃO: Adicionar paginação e filtros otimizados
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir filtro
    const filter = status ? { status } : {};
    
    // Se since for fornecido, filtrar apenas pedidos criados após essa data
    if (since) {
      try {
        const sinceDate = new Date(since)
        // Garantir que estamos procurando pedidos criados DEPOIS da data fornecida
        filter.createdAt = { $gt: sinceDate }
        console.log('[API Orders] Filtrando pedidos após:', sinceDate.toISOString())
      } catch (e) {
        console.error('[API Orders] Erro ao parsear data since:', e)
        // Ignorar erro de parsing da data
      }
    }
    
    // Buscar pedidos com paginação e ordenação otimizada
    const [ordersData, totalCount] = await Promise.all([
      orders.find(filter)
        .sort({ createdAt: -1 }) // Índice otimizado
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      orders.countDocuments(filter)
    ]);
    
    return {
      orders: ordersData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar pedidos",
    });
  }
});
