// server/api/inventory/reports.get.ts
import { getDB } from "../../utils/db";
import { requireAuth } from "../../utils/auth-middleware";

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  await requireAuth(event);
  
  const query = getQuery(event);
  const { period = '30' } = query; // dias

  try {
    const db = await getDB();
    const inventory = db.collection("inventory");
    const movements = db.collection("inventory_movements");

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Estatísticas gerais
    const totalProducts = await inventory.countDocuments();
    const lowStockItems = await inventory.countDocuments({
      $expr: { $lte: ["$currentStock", "$minStock"] }
    });
    const outOfStockItems = await inventory.countDocuments({
      currentStock: 0
    });

    // Valor total do estoque
    const inventoryItems = await inventory.find({}).toArray();
    const totalValue = inventoryItems.reduce((sum, item) => {
      return sum + (item.currentStock * item.costPrice);
    }, 0);

    // Movimentações do período
    const periodMovements = await movements.find({
      createdAt: { $gte: daysAgo }
    }).toArray();

    // Análise de movimentações por tipo
    const movementsByType = periodMovements.reduce((acc, movement) => {
      if (!acc[movement.type]) {
        acc[movement.type] = { count: 0, quantity: 0 };
      }
      acc[movement.type].count++;
      acc[movement.type].quantity += movement.quantity;
      return acc;
    }, {});

    // Produtos mais movimentados
    const productMovements = periodMovements.reduce((acc, movement) => {
      const productId = movement.productId.toString();
      if (!acc[productId]) {
        acc[productId] = {
          productName: movement.productName,
          movements: 0,
          totalQuantity: 0
        };
      }
      acc[productId].movements++;
      acc[productId].totalQuantity += movement.quantity;
      return acc;
    }, {});

    const topMovedProducts = Object.values(productMovements)
      .sort((a, b) => b.movements - a.movements)
      .slice(0, 10);

    // Produtos com estoque baixo
    const lowStockProducts = await inventory.find({
      $expr: { $lte: ["$currentStock", "$minStock"] }
    }).sort({ currentStock: 1 }).toArray();

    // Produtos sem estoque
    const outOfStockProducts = await inventory.find({
      currentStock: 0
    }).sort({ productName: 1 }).toArray();

    // Tendências de estoque (últimos 7 dias)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayMovements = await movements.find({
        createdAt: { $gte: date, $lt: nextDate }
      }).toArray();

      const dayStats = dayMovements.reduce((acc, movement) => {
        if (movement.type === 'entrada') {
          acc.entradas += movement.quantity;
        } else if (movement.type === 'saida') {
          acc.saidas += movement.quantity;
        }
        return acc;
      }, { entradas: 0, saidas: 0 });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        entradas: dayStats.entradas,
        saidas: dayStats.saidas,
        saldo: dayStats.entradas - dayStats.saidas
      });
    }

    return {
      summary: {
        totalProducts,
        lowStockItems,
        outOfStockItems,
        totalValue: parseFloat(totalValue.toFixed(2)),
        periodDays: parseInt(period)
      },
      movements: {
        total: periodMovements.length,
        byType: movementsByType
      },
      topMovedProducts,
      alerts: {
        lowStock: lowStockProducts.map(item => ({
          id: item._id,
          productName: item.productName,
          currentStock: item.currentStock,
          minStock: item.minStock,
          difference: item.minStock - item.currentStock
        })),
        outOfStock: outOfStockProducts.map(item => ({
          id: item._id,
          productName: item.productName,
          minStock: item.minStock
        }))
      },
      trends: last7Days
    };

  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Erro ao gerar relatório de estoque",
    });
  }
});
