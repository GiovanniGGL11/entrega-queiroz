// server/api/orders.post.ts
import { getDB } from "../utils/db";
import { ObjectId } from "mongodb";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { 
    customerInfo, 
    items, 
    deliveryInfo, 
    paymentMethod, 
    totalAmount,
    notes 
  } = body;

  // Validações básicas
  if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
    throw createError({
      statusCode: 400,
      message: "Informações do cliente são obrigatórias",
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Pelo menos um item é obrigatório",
    });
  }

  if (!deliveryInfo || !deliveryInfo.address) {
    throw createError({
      statusCode: 400,
      message: "Informações de entrega são obrigatórias",
    });
  }

  if (!totalAmount || totalAmount <= 0) {
    throw createError({
      statusCode: 400,
      message: "Valor total deve ser maior que zero",
    });
  }

  try {
    const db = await getDB();
    const products = db.collection("products");
    
    // VALIDAÇÃO DE SEGURANÇA: Verificar preços e produtos reais
    let calculatedTotal = 0;
    const validatedItems = [];
    
    for (const item of items) {
      // Validar estrutura básica do item
      if (!item.name || !item.quantity) {
        throw createError({
          statusCode: 400,
          message: "Nome e quantidade do produto são obrigatórios",
        });
      }
      
      // Buscar produto real no banco de dados pelo nome
      const realProduct = await products.findOne({ name: item.name.trim() });
      if (!realProduct) {
        throw createError({
          statusCode: 400,
          message: `Produto "${item.name}" não encontrado`,
        });
      }
      
      // Usar APENAS dados reais do banco de dados (ignorar completamente dados do frontend)
      const realPrice = parseFloat(realProduct.price);
      const quantity = parseInt(item.quantity);
      const realSubtotal = realPrice * quantity;
      
      
      // Usar dados reais do banco de dados
      validatedItems.push({
        productId: realProduct._id,
        name: realProduct.name,
        quantity: quantity,
        price: realPrice,
        subtotal: realSubtotal,
        complements: item.complements || []
      });
      
      calculatedTotal += realSubtotal;
    }
    
    // VALIDAÇÃO: Verificar taxa de entrega
    const realDeliveryFee = parseFloat(deliveryInfo.deliveryFee) || 0;
    calculatedTotal += realDeliveryFee;
    
    // Usar APENAS o total calculado pelo backend (ignorar total do frontend)
    
    const orders = db.collection("orders");
    const inventory = db.collection("inventory");
    
    // Verificar estoque dos produtos usando dados validados
    for (const item of validatedItems) {
      if (item.productId) {
        const inventoryItem = await inventory.findOne({ productId: item.productId });
        if (inventoryItem && inventoryItem.currentStock < item.quantity) {
          throw createError({
            statusCode: 400,
            message: `Estoque insuficiente para ${item.name}. Disponível: ${inventoryItem.currentStock}`,
          });
        }
      }
    }

    // Gerar número do pedido
    const orderNumber = `PED${Date.now().toString().slice(-8)}`;

    const order = {
      orderNumber,
      customerInfo: {
        name: customerInfo.name.trim(),
        phone: customerInfo.phone.trim(),
        email: customerInfo.email?.trim() || '',
      },
      items: validatedItems,
      deliveryInfo: {
        address: deliveryInfo.address.trim(),
        neighborhood: deliveryInfo.neighborhood?.trim() || '',
        city: deliveryInfo.city?.trim() || '',
        zipCode: deliveryInfo.zipCode?.trim() || '',
        complement: deliveryInfo.complement?.trim() || '',
        deliveryFee: parseFloat(deliveryInfo.deliveryFee) || 0,
        estimatedTime: deliveryInfo.estimatedTime || '30-45 min'
      },
      paymentMethod: paymentMethod || 'dinheiro',
      totalAmount: calculatedTotal,
      notes: notes?.trim() || '',
      status: 'pending', // pending, confirmed, preparing, ready, delivered, cancelled
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await orders.insertOne(order);

    // Atualizar estoque dos produtos usando dados validados
    for (const item of validatedItems) {
      if (item.productId) {
        await inventory.updateOne(
          { productId: item.productId },
          { 
            $inc: { 
              currentStock: -item.quantity,
              totalSold: item.quantity
            },
            $set: { 
              lastUpdated: new Date(),
              updatedAt: new Date()
            }
          }
        );
      }
    }
    
    return { 
      success: true,
      id: result.insertedId, 
      orderNumber: orderNumber,
      message: "Pedido criado com sucesso",
      order: {
        _id: result.insertedId,
        ...order
      }
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao criar pedido" 
    });
  }
});
