import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  // Autenticação direta sem middleware
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token de autenticação necessário'
    })
  }
  
  // Verificar token
  try {
    const decoded = verifyUserToken(token)
    // Token válido, continuar
  } catch (jwtError) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido ou expirado'
    })
  }
  
  try {
    const db = await getDB();
    
    // OTIMIZAÇÃO: Usar aggregation pipeline para calcular estatísticas diretamente no MongoDB
    const [ordersStats, productsStats, categoriesStats] = await Promise.all([
      // Estatísticas de pedidos usando aggregation
      db.collection("orders").aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
              }
            },
            ordersToday: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$createdAt",
                      new Date(new Date().setHours(0, 0, 0, 0))
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            revenueToday: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$createdAt",
                      new Date(new Date().setHours(0, 0, 0, 0))
                    ]
                  },
                  "$totalAmount",
                  0
                ]
              }
            }
          }
        }
      ]).toArray(),
      
      // Contar produtos
      db.collection("products").countDocuments(),
      
      // Contar categorias
      db.collection("categories").countDocuments()
    ]);
    
    const stats = ordersStats[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, ordersToday: 0, revenueToday: 0 };
    const totalProducts = productsStats;
    const totalCategories = categoriesStats;
    
    // Calcular estatísticas básicas
    const totalOrders = stats.totalOrders;
    const pendingOrders = stats.pendingOrders;
    const totalRevenue = stats.totalRevenue;
    
    // Calcular ticket médio
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // OTIMIZAÇÃO: Calcular estatísticas por período usando aggregation
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);
    
    const [periodStats, itemSalesStats, weekStats, monthStats, yearStats, paymentMethodStats, activeStatusStats, orderTypeStats] = await Promise.all([
      // Estatísticas por período
      db.collection("orders").aggregate([
        {
          $group: {
            _id: null,
            revenueToday: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", today] },
                  "$totalAmount",
                  0
                ]
              }
            },
            revenueThisWeek: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", thisWeek] },
                  "$totalAmount",
                  0
                ]
              }
            },
            revenueThisMonth: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", thisMonth] },
                  "$totalAmount",
                  0
                ]
              }
            },
            revenueThisYear: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", thisYear] },
                  "$totalAmount",
                  0
                ]
              }
            }
          }
        }
      ]).toArray(),
      
      // Item mais vendido usando aggregation
      db.collection("orders").aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
      ]).toArray(),
      
      // Estatísticas da semana (incluindo hoje)
      db.collection("orders").aggregate([
        {
          $match: {
            createdAt: { $gte: thisWeek }
          }
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" }
          }
        }
      ]).toArray(),
      
      // Estatísticas do mês (incluindo hoje)
      db.collection("orders").aggregate([
        {
          $match: {
            createdAt: { $gte: thisMonth }
          }
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" }
          }
        }
      ]).toArray(),
      
      // Estatísticas do ano
      db.collection("orders").aggregate([
        {
          $match: {
            createdAt: { $gte: thisYear }
          }
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" }
          }
        }
      ]).toArray(),
      
      // Estatísticas por forma de pagamento (todas)
      db.collection("orders").aggregate([
        {
          $group: {
            _id: "$paymentMethod",
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 }
          }
        }
      ]).toArray(),

      // Pedidos por status (ativos)
      db.collection("orders").aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]).toArray(),

      // Pedidos por tipo (delivery/retirada/balcao) - mês atual
      db.collection("orders").aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } } },
        {
          $group: {
            _id: { $ifNull: ["$type", "delivery"] },
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" }
          }
        }
      ]).toArray()
    ]);
    
    // Estatísticas por forma de pagamento por período
    const [paymentToday, paymentWeek, paymentMonth, paymentYear] = await Promise.all([
      db.collection("orders").aggregate([
        {
          $match: { createdAt: { $gte: today } }
        },
        {
          $group: {
            _id: "$paymentMethod",
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 }
          }
        }
      ]).toArray(),
      db.collection("orders").aggregate([
        {
          $match: { createdAt: { $gte: thisWeek } }
        },
        {
          $group: {
            _id: "$paymentMethod",
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 }
          }
        }
      ]).toArray(),
      db.collection("orders").aggregate([
        {
          $match: { createdAt: { $gte: thisMonth } }
        },
        {
          $group: {
            _id: "$paymentMethod",
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 }
          }
        }
      ]).toArray(),
      db.collection("orders").aggregate([
        {
          $match: { createdAt: { $gte: thisYear } }
        },
        {
          $group: {
            _id: "$paymentMethod",
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 }
          }
        }
      ]).toArray()
    ]);
    
    const periodData = periodStats[0] || { revenueToday: 0, revenueThisWeek: 0, revenueThisMonth: 0, revenueThisYear: 0 };

    // Processar status ativos
    const statusCounts: Record<string, number> = {}
    activeStatusStats.forEach((s: any) => { statusCounts[s._id || 'unknown'] = s.count })

    // Contar pedidos em andamento (não entregues/cancelados)
    const activeOrders = (statusCounts['pending'] || 0) + (statusCounts['confirmed'] || 0) +
      (statusCounts['preparing'] || 0) + (statusCounts['ready'] || 0) + (statusCounts['out_for_delivery'] || 0)

    // Processar pedidos por tipo
    const typeMap: Record<string, { count: number, revenue: number }> = { delivery: { count: 0, revenue: 0 }, retirada: { count: 0, revenue: 0 }, balcao: { count: 0, revenue: 0 } }
    orderTypeStats.forEach((t: any) => {
      const key = t._id || 'delivery'
      if (typeMap[key]) { typeMap[key].count = t.count; typeMap[key].revenue = t.revenue }
    })
    const weekData = weekStats[0] || { orders: 0, revenue: 0 };
    const monthData = monthStats[0] || { orders: 0, revenue: 0 };
    const yearData = yearStats[0] || { orders: 0, revenue: 0 };
    
    // Calcular item mais vendido (filtrar itens sem nome válido)
    const validItemSalesStats = itemSalesStats.filter(item => item._id && item._id.trim())
    const mostSoldItem = validItemSalesStats[0] || { _id: 'Nenhum', totalQuantity: 0 };
    
    // Calcular ticket médio para cada período
    const weekAverageTicket = weekData.orders > 0 ? weekData.revenue / weekData.orders : 0;
    const monthAverageTicket = monthData.orders > 0 ? monthData.revenue / monthData.orders : 0;
    const yearAverageTicket = yearData.orders > 0 ? yearData.revenue / yearData.orders : 0;
    
    // Função auxiliar para processar estatísticas de pagamento
    const processPaymentStats = (statsArray) => {
      const methods = {
        pix: { revenue: 0, orders: 0 },
        dinheiro: { revenue: 0, orders: 0 },
        cartao: { revenue: 0, orders: 0 }
      }
      
      statsArray.forEach(stat => {
        const method = stat._id || 'dinheiro'
        if (methods[method]) {
          methods[method].revenue = stat.totalRevenue || 0
          methods[method].orders = stat.totalOrders || 0
        }
      })
      
      return methods
    }
    
    // Processar estatísticas por forma de pagamento (todas)
    const paymentMethods = processPaymentStats(paymentMethodStats)
    
    // Processar estatísticas por período
    const paymentMethodsByPeriod = {
      today: processPaymentStats(paymentToday),
      week: processPaymentStats(paymentWeek),
      month: processPaymentStats(paymentMonth),
      year: processPaymentStats(paymentYear)
    }
    
    // Preparar resposta otimizada
    return {
      basic: {
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalProducts,
        totalCategories,
        averageTicket
      },
      periods: {
        today: { 
          orders: stats.ordersToday, 
          revenue: periodData.revenueToday, 
          averageTicket: stats.ordersToday > 0 ? periodData.revenueToday / stats.ordersToday : 0 
        },
        week: { 
          orders: weekData.orders, 
          revenue: periodData.revenueThisWeek, 
          averageTicket: weekAverageTicket,
          growth: 0 
        },
        month: { 
          orders: monthData.orders, 
          revenue: periodData.revenueThisMonth, 
          averageTicket: monthAverageTicket,
          growth: 0 
        },
        year: { 
          orders: yearData.orders, 
          revenue: periodData.revenueThisYear, 
          averageTicket: yearAverageTicket 
        }
      },
      insights: {
        mostSoldItem: { 
          name: mostSoldItem._id || 'Nenhum', 
          quantity: mostSoldItem.totalQuantity || 0 
        },
        topSellingItems: validItemSalesStats
          .slice(0, 5)
          .map(item => ({
            name: item._id || 'Sem nome',
            quantity: item.totalQuantity || 0,
            revenue: item.totalRevenue || 0
          }))
      },
      paymentMethods: paymentMethods,
      paymentMethodsByPeriod: paymentMethodsByPeriod,
      activeOrders,
      statusCounts,
      ordersByType: typeMap
    };
    
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao calcular estatísticas'
    });
  }
});