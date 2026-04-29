import { getDB } from '../../../../utils/db'
import { ObjectId } from 'mongodb'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id || !ObjectId.isValid(id)) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

  const body = await readBody(event)
  const { stars, comment } = body

  if (!stars || stars < 1 || stars > 5) {
    throw createError({ statusCode: 400, statusMessage: 'Avaliação deve ser de 1 a 5 estrelas' })
  }

  const db = await getDB()
  const order = await db.collection('orders').findOne({ _id: new ObjectId(id) })

  if (!order) throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' })
  if (order.status !== 'delivered') throw createError({ statusCode: 400, statusMessage: 'Só é possível avaliar pedidos entregues' })
  if (order.review) throw createError({ statusCode: 400, statusMessage: 'Pedido já foi avaliado' })

  await db.collection('orders').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        review: {
          stars: Number(stars),
          comment: (comment || '').trim().substring(0, 500),
          createdAt: new Date()
        }
      }
    }
  )

  return { success: true }
})
