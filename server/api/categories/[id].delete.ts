import { connectToDatabase } from '../../utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da categoria é obrigatório'
      })
    }

    const { db } = await connectToDatabase()
    
    const result = await db.collection('categories').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Categoria não encontrada'
      })
    }

    return { success: true, message: 'Categoria deletada com sucesso' }
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




