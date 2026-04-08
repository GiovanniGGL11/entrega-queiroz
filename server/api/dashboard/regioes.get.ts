import { getDB } from '../../utils/db'
import { verifyUserToken } from '../../utils/auth'
import { getRequestHeader, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const { period = 'month' } = getQuery(event)

  const now = new Date()
  let startDate: Date

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  } else if (period === 'week') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - now.getDay())
    startDate.setHours(0, 0, 0, 0)
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  }

  const db = await getDB()

  const orders = await db.collection('orders').find({
    status: { $nin: ['cancelled'] },
    createdAt: { $gte: startDate }
  }).toArray()

  const mapaRegioes: Record<string, number> = {}

  for (const order of orders) {
    const bairro = order.deliveryInfo?.neighborhood?.trim()
    const cidade = order.deliveryInfo?.city?.trim()
    if (!bairro && !cidade) continue
    const chave = bairro ? (cidade ? `${bairro}, ${cidade}` : bairro) : cidade
    mapaRegioes[chave] = (mapaRegioes[chave] || 0) + 1
  }

  const regioes = Object.entries(mapaRegioes)
    .map(([regiao, total]) => ({ regiao, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return { regioes, totalPedidos: orders.length }
})
