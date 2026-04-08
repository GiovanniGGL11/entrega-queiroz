import { getDB } from '../../utils/db'
import { verifyUserToken } from '../../utils/auth'
import { getRequestHeader, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const { period = 'today' } = getQuery(event)

  // Calcular range de datas
  const now = new Date()
  let startDate: Date

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  } else if (period === 'week') {
    const day = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() - day)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  }

  const db = await getDB()

  // Buscar pedidos com motoboy atribuído no período
  const orders = await db.collection('orders').find({
    motoboyId: { $exists: true, $ne: '' },
    status: { $nin: ['cancelled'] },
    createdAt: { $gte: startDate }
  }).toArray()

  // Agrupar por motoboy
  const mapaMotoBoy: Record<string, any> = {}

  for (const order of orders) {
    const id = order.motoboyId?.toString() || 'sem-id'
    const nome = order.motoboyNome || 'Desconhecido'
    const frete = order.deliveryInfo?.deliveryFee || order.deliveryFee || 0

    if (!mapaMotoBoy[id]) {
      mapaMotoBoy[id] = {
        motoboyId: id,
        motoboyNome: nome,
        totalEntregas: 0,
        totalFretes: 0,
        pedidos: []
      }
    }

    mapaMotoBoy[id].totalEntregas++
    mapaMotoBoy[id].totalFretes += frete
    mapaMotoBoy[id].pedidos.push({
      pedidoId: order.orderNumber || order._id?.toString(),
      frete,
      status: order.status,
      createdAt: order.createdAt
    })
  }

  // Buscar foto de cada motoboy
  const motoboyIds = Object.keys(mapaMotoBoy).filter(id => id !== 'sem-id')
  if (motoboyIds.length > 0) {
    try {
      const { ObjectId } = await import('mongodb')
      const motoboysDocs = await db.collection('motoboys').find({
        _id: { $in: motoboyIds.map(id => { try { return new ObjectId(id) } catch { return id } }) }
      }).toArray()

      for (const m of motoboysDocs) {
        const id = m._id.toString()
        if (mapaMotoBoy[id]) {
          mapaMotoBoy[id].foto = m.foto || ''
        }
      }
    } catch (e) {}
  }

  const resultado = Object.values(mapaMotoBoy).sort((a: any, b: any) => b.totalFretes - a.totalFretes)
  const totalGeral = resultado.reduce((acc: number, m: any) => acc + m.totalFretes, 0)
  const totalEntregas = resultado.reduce((acc: number, m: any) => acc + m.totalEntregas, 0)

  return {
    periodo: period,
    startDate,
    motoboys: resultado,
    totalGeral,
    totalEntregas
  }
})
