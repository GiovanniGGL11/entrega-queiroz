import { getDB } from "../../utils/db";
import { requireAuth } from "../../utils/auth-middleware";
import { getRequestHeader, getCookie } from 'h3';

export default defineEventHandler(async (event) => {
  // Debug logs para produção
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 [DASHBOARD STATS] Endpoint chamado')
    
    // Verificar headers
    const authHeader = getRequestHeader(event, 'authorization')
    console.log('🔍 [DASHBOARD STATS] Authorization header:', authHeader ? 'present' : 'missing')
    if (authHeader) {
      console.log('🔍 [DASHBOARD STATS] Authorization header value:', authHeader)
    }
    
    // Verificar cookies
    const cookies = getCookie(event, 'auth_token')
    console.log('🔍 [DASHBOARD STATS] Auth cookie:', cookies ? 'present' : 'missing')
  }
  
  // Verificar autenticação
  await requireAuth(event);
  
  try {
    const db = await getDB();
    
    // Buscar todos os pedidos
    const orders = await db.collection("orders").find({}).toArray();
    
    // Buscar todos os produtos
    const products = await db.collection("products").find({}).toArray();
    
    // Calcular estatísticas básicas
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalProducts = products.length;
    
    // Calcular ticket médio
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calcular estatísticas por período
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);
    
    const ordersToday = orders.filter(order => new Date(order.createdAt) >= today);
    const ordersThisWeek = orders.filter(order => new Date(order.createdAt) >= thisWeek);
    const ordersThisMonth = orders.filter(order => new Date(order.createdAt) >= thisMonth);
    const ordersThisYear = orders.filter(order => new Date(order.createdAt) >= thisYear);
    
    const revenueToday = ordersToday.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const revenueThisWeek = ordersThisWeek.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const revenueThisMonth = ordersThisMonth.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const revenueThisYear = ordersThisYear.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calcular item mais vendido
    const itemSales = {};
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (itemSales[item.name]) {
            itemSales[item.name] += item.quantity;
          } else {
            itemSales[item.name] = item.quantity;
          }
        });
      }
    });
    
    const mostSoldItem = Object.keys(itemSales).reduce((a, b) => 
      itemSales[a] > itemSales[b] ? a : b, Object.keys(itemSales)[0] || 'Nenhum'
    );
    
    // Calcular estatísticas de status
    const statusStats = {};
    orders.forEach(order => {
      statusStats[order.status] = (statusStats[order.status] || 0) + 1;
    });
    
    // Calcular crescimento (comparando com período anterior)
    const lastWeek = new Date(thisWeek.getTime() - (7 * 24 * 60 * 60 * 1000));
    const lastMonth = new Date(thisMonth.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const ordersLastWeek = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= lastWeek && orderDate < thisWeek;
    });
    const ordersLastMonth = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= lastMonth && orderDate < thisMonth;
    });
    
    const revenueLastWeek = ordersLastWeek.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const revenueLastMonth = ordersLastMonth.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const weeklyGrowth = revenueLastWeek > 0 ? ((revenueThisWeek - revenueLastWeek) / revenueLastWeek) * 100 : 0;
    const monthlyGrowth = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;
    
    return {
      basic: {
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalProducts,
        averageTicket
      },
      periods: {
        today: {
          orders: ordersToday.length,
          revenue: revenueToday,
          averageTicket: ordersToday.length > 0 ? revenueToday / ordersToday.length : 0
        },
        week: {
          orders: ordersThisWeek.length,
          revenue: revenueThisWeek,
          averageTicket: ordersThisWeek.length > 0 ? revenueThisWeek / ordersThisWeek.length : 0,
          growth: weeklyGrowth
        },
        month: {
          orders: ordersThisMonth.length,
          revenue: revenueThisMonth,
          averageTicket: ordersThisMonth.length > 0 ? revenueThisMonth / ordersThisMonth.length : 0,
          growth: monthlyGrowth
        },
        year: {
          orders: ordersThisYear.length,
          revenue: revenueThisYear,
          averageTicket: ordersThisYear.length > 0 ? revenueThisYear / ordersThisYear.length : 0
        }
      },
      insights: {
        mostSoldItem: {
          name: mostSoldItem,
          quantity: itemSales[mostSoldItem] || 0
        },
        statusDistribution: statusStats,
        topSellingItems: Object.entries(itemSales)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, quantity]) => ({ name, quantity }))
      }
    };
    
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    throw createError({
      statusCode: 500,
      message: "Erro ao calcular estatísticas do dashboard",
    });
  }
});