import { connectToDatabase } from '../../utils/db'
import { ObjectId } from 'mongodb'
import { requireAuth } from '../../utils/auth-middleware'

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  await requireAuth(event);
  
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
      console.log(`Excluídos ${deleteProductsResult.deletedCount} produtos da categoria ${id}`)
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




