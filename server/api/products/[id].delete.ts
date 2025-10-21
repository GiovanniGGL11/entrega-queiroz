import { connectToDatabase } from '../../utils/db'
import { ObjectId } from 'mongodb'
import { requireAuth } from '../../utils/auth-middleware'

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  await requireAuth(event);
  
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




