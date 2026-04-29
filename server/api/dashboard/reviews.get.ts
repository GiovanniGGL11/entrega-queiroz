import { getDB } from '../../utils/db'
import { verifyUserToken } from '../../utils/auth'
import { getRequestHeader, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const db = await getDB()

  const orders = await db.collection('orders')
    .find({ review: { $exists: true } })
    .sort({ 'review.createdAt': -1 })
    .toArray()

  const total = orders.length
  const average = total > 0
    ? Math.round((orders.reduce((s, o) => s + o.review.stars, 0) / total) * 10) / 10
    : 0

  const distribution = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: orders.filter(o => o.review.stars === s).length
  }))

  const reviews = orders.slice(0, 50).map(o => ({
    orderId: o._id.toString(),
    orderNumber: o.orderNumber,
    customerName: o.customerInfo?.name || 'Cliente',
    stars: o.review.stars,
    comment: o.review.comment || '',
    createdAt: o.review.createdAt
  }))

  return { total, average, distribution, reviews }
})
