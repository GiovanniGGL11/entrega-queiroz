import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, getQuery, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })

  try {
    verifyUserToken(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Token inválido' })
  }

  const query = getQuery(event)
  const startRaw = String(query.start || '')
  const endRaw   = String(query.end   || '')

  if (!startRaw || !endRaw) {
    throw createError({ statusCode: 400, statusMessage: 'Parâmetros start e end são obrigatórios' })
  }

  const start = new Date(startRaw)
  // end é inclusivo: avança para o fim do dia/mês/ano informado
  const end = new Date(endRaw)
  end.setHours(23, 59, 59, 999)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Datas inválidas' })
  }

  if (start > end) {
    throw createError({ statusCode: 400, statusMessage: 'Data inicial deve ser anterior à data final' })
  }

  try {
    const db = await getDB()
    const match = { createdAt: { $gte: start, $lte: end } }

    const [rangeStats, statusStats, paymentStats, itemStats, costStats] = await Promise.all([
      // Receita, desconto, taxa de entrega
      db.collection("orders").aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
            discountTotal: { $sum: { $ifNull: ["$discount", 0] } },
            deliveryFeeTotal: { $sum: { $ifNull: ["$deliveryInfo.deliveryFee", 0] } }
          }
        }
      ]).toArray(),

      // Status
      db.collection("orders").aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]).toArray(),

      // Pagamento
      db.collection("orders").aggregate([
        { $match: match },
        { $group: { _id: "$paymentMethod", revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } }
      ]).toArray(),

      // Top itens
      db.collection("orders").aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 }
      ]).toArray(),

      // Custo dos itens (movimentos de estoque)
      db.collection("inventory_movements").aggregate([
        { $match: { type: "saida", createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            itemCostTotal: {
              $sum: { $multiply: [{ $ifNull: ["$costPrice", 0] }, { $ifNull: ["$quantity", 0] }] }
            }
          }
        }
      ]).toArray()
    ])

    const r = rangeStats[0] || { orders: 0, revenue: 0, discountTotal: 0, deliveryFeeTotal: 0 }
    const c = costStats[0] || { itemCostTotal: 0 }

    const statusCounts: Record<string, number> = {}
    statusStats.forEach((s: any) => { statusCounts[s._id || 'unknown'] = s.count })

    const paymentMethods: Record<string, { revenue: number, orders: number }> = {
      pix: { revenue: 0, orders: 0 },
      dinheiro: { revenue: 0, orders: 0 },
      cartao: { revenue: 0, orders: 0 }
    }
    paymentStats.forEach((s: any) => {
      const m = s._id || 'dinheiro'
      if (paymentMethods[m]) { paymentMethods[m].revenue = s.revenue; paymentMethods[m].orders = s.orders }
    })

    const topSellingItems = itemStats
      .filter((i: any) => i._id && i._id.trim())
      .map((i: any) => ({ name: i._id, quantity: i.quantity, revenue: i.revenue }))

    return {
      orders: r.orders,
      revenue: r.revenue,
      grossRevenue: r.revenue + r.discountTotal,
      discountTotal: r.discountTotal,
      deliveryFeeTotal: r.deliveryFeeTotal,
      itemCostTotal: c.itemCostTotal,
      averageTicket: r.orders > 0 ? r.revenue / r.orders : 0,
      statusCounts,
      paymentMethods,
      topSellingItems
    }

  } catch (error) {
    if ((error as any).statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao calcular estatísticas do período' })
  }
})
