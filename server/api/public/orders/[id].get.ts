import { getDB } from '../../../utils/db'
import { ObjectId } from 'mongodb'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

  const db = await getDB()

  let order
  try {
    order = await db.collection('orders').findOne({ _id: new ObjectId(id) })
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  if (!order) throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' })

  // Retornar apenas dados necessários para o cliente — sem dados sensíveis
  return {
    _id: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    motoboyNome: order.motoboyNome || null,
    items: (order.items || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      complements: item.complements || []
    })),
    deliveryInfo: {
      address: order.deliveryInfo?.address || '',
      number: order.deliveryInfo?.number || '',
      complement: order.deliveryInfo?.complement || '',
      neighborhood: order.deliveryInfo?.neighborhood || '',
      city: order.deliveryInfo?.city || '',
      deliveryFee: order.deliveryInfo?.deliveryFee ?? order.deliveryFee ?? 0,
      estimatedTime: order.deliveryInfo?.estimatedTime || ''
    },
    customerInfo: {
      name: order.customerInfo?.name || ''
    },
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount ?? order.total ?? 0,
    subtotal: (order.items || []).reduce((sum: number, item: any) => sum + (item.subtotal ?? item.price * item.quantity ?? 0), 0),
    discount: order.discount ?? 0,
    coupon: order.coupon ?? null,
    notes: order.notes || ''
  }
})
