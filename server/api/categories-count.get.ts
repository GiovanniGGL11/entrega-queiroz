// server/api/categories-count.get.ts
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
  try {
    const db = await getDB();
    const products = db.collection("products");
    
    // Agrupar produtos por categoryId e contar
    const pipeline = [
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 }
        }
      }
    ];
    
    const result = await products.aggregate(pipeline).toArray();
    
    // Converter para objeto com categoryId como chave
    const counts = {};
    result.forEach(item => {
      // Usar string vazia para null/undefined
      const categoryId = item._id || '';
      counts[categoryId] = item.count;
    });
    
    
    return counts;
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao contar produtos por categoria",
    });
  }
});
