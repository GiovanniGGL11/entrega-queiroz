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
    
    const [periodStats, itemSalesStats, weekStats, monthStats, yearStats] = await Promise.all([
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
      ]).toArray()
    ]);
    
    const periodData = periodStats[0] || { revenueToday: 0, revenueThisWeek: 0, revenueThisMonth: 0, revenueThisYear: 0 };
    const weekData = weekStats[0] || { orders: 0, revenue: 0 };
    const monthData = monthStats[0] || { orders: 0, revenue: 0 };
    const yearData = yearStats[0] || { orders: 0, revenue: 0 };
    
    // Calcular item mais vendido
    const mostSoldItem = itemSalesStats[0] || { _id: 'Nenhum', totalQuantity: 0 };
    
    // Calcular ticket médio para cada período
    const weekAverageTicket = weekData.orders > 0 ? weekData.revenue / weekData.orders : 0;
    const monthAverageTicket = monthData.orders > 0 ? monthData.revenue / monthData.orders : 0;
    const yearAverageTicket = yearData.orders > 0 ? yearData.revenue / yearData.orders : 0;
    
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
          name: mostSoldItem._id, 
          quantity: mostSoldItem.totalQuantity 
        },
        topSellingItems: itemSalesStats.slice(0, 5).map(item => ({
          name: item._id,
          quantity: item.totalQuantity,
          revenue: item.totalRevenue
        }))
      }
    };
    
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao calcular estatísticas'
    });
  }
});