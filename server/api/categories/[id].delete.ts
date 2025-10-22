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
    const body = await readBody(event)
    const { deleteProducts = false } = body
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da categoria é obrigatório'
      })
    }

    const { db } = await connectToDatabase()
    
    // Verificar se existem produtos nesta categoria
    const productsCount = await db.collection('products').countDocuments({
      categoryId: id
    })
    
    // Se há produtos e não foi solicitada a exclusão em cascata
    if (productsCount > 0 && !deleteProducts) {
      throw createError({
        statusCode: 409,
        statusMessage: `Não é possível excluir esta categoria pois existem ${productsCount} produto(s) associado(s). Primeiro mova ou exclua os produtos desta categoria.`
      })
    }
    
    // Se foi solicitada a exclusão em cascata, excluir produtos primeiro
    if (deleteProducts && productsCount > 0) {
      const deleteProductsResult = await db.collection('products').deleteMany({
        categoryId: id
      })
    }
    
    const result = await db.collection('categories').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Categoria não encontrada'
      })
    }

    return { 
      success: true, 
      message: deleteProducts && productsCount > 0 
        ? `Categoria e ${productsCount} produto(s) excluído(s) com sucesso`
        : 'Categoria deletada com sucesso'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao deletar categoria'
    })
  }
})
