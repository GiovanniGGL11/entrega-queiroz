// server/api/inventory/[id].delete.ts
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
  
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do estoque é obrigatório",
    });
  }

  try {
    const db = await getDB();
    const inventory = db.collection("inventory");
    
    const result = await inventory.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "Item de estoque não encontrado",
      });
    }
    
    return { 
      message: "Controle de estoque removido com sucesso"
    };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao remover controle de estoque" 
    });
  }
});
