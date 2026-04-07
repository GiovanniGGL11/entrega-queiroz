import { getDB } from '../../../../utils/db'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const numero = event.context.params?.numero
  if (!numero) throw createError({ statusCode: 400, statusMessage: 'Número inválido' })

  const db = await getDB()

  const order = await db.collection('orders').findOne({ orderNumber: numero.trim() })

  if (!order) throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' })

  return { _id: order._id.toString() }
})
