import { connectToDatabase } from '../../utils/db'
import { ObjectId } from 'mongodb'
import { verifyUserToken } from '../../utils/auth'
import { getRequestHeader, createError } from 'h3'

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
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do produto é obrigatório'
      })
    }

    const { db } = await connectToDatabase()
    
    const result = await db.collection('products').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produto não encontrado'
      })
    }

    return { success: true, message: 'Produto deletado com sucesso' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao deletar produto'
    })
  }
})




