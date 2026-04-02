// server/api/inventory/movements.get.ts
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
  
  const query = getQuery(event);
  const { inventoryId, type, limit = '50', offset = '0' } = query;

  try {
    const db = await getDB();
    const movements = db.collection("inventory_movements");
    
    let filter = {};
    
    if (inventoryId) {
      filter.inventoryId = new ObjectId(inventoryId);
    }
    
    if (type) {
      filter.type = type;
    }

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    const movementsList = await movements
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .toArray();

    const total = await movements.countDocuments(filter);

    return {
      movements: movementsList,
      total,
      limit: limitNum,
      offset: offsetNum
    };

  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar movimentações de estoque",
    });
  }
});
