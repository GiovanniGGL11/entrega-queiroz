import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { ObjectId } from "mongodb";
import { getRequestHeader, createError } from "h3";
import { sanitizeString } from "../../utils/security";

export default defineEventHandler(async (event) => {
  // Autenticação obrigatória (funcionário ou dono)
  const authHeader = getRequestHeader(event, "authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) throw createError({ statusCode: 401, statusMessage: "Token necessário" });
  let userData: any;
  try {
    userData = verifyUserToken(token);
  } catch {
    throw createError({ statusCode: 401, statusMessage: "Token inválido" });
  }

  const body = await readBody(event);
  const { items, paymentMethod, changeFor, customerName, notes } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Pelo menos um item é obrigatório" });
  }

  const validPayments = ["dinheiro", "pix", "cartao_credito", "cartao_debito"];
  if (!paymentMethod || !validPayments.includes(paymentMethod)) {
    throw createError({ statusCode: 400, statusMessage: "Forma de pagamento inválida" });
  }

  if (paymentMethod === "dinheiro" && changeFor !== undefined && changeFor !== null) {
    const changeVal = parseFloat(changeFor);
    if (isNaN(changeVal) || changeVal < 0) {
      throw createError({ statusCode: 400, statusMessage: "Valor para troco inválido" });
    }
  }

  const db = await getDB();
  const products = db.collection("products");

  // Validar e calcular itens com preços reais do banco
  let calculatedTotal = 0;
  const validatedItems: any[] = [];

  for (const item of items) {
    if (!item.quantity || item.quantity <= 0) {
      throw createError({ statusCode: 400, statusMessage: "Quantidade inválida" });
    }

    let realProduct: any = null;

    if (item.productId) {
      try {
        realProduct = await products.findOne({ _id: new ObjectId(item.productId) });
      } catch {
        // ID inválido, tentar pelo nome
      }
    }

    if (!realProduct && item.name) {
      realProduct = await products.findOne({ name: item.name.trim() });
    }

    if (!realProduct) {
      throw createError({
        statusCode: 400,
        statusMessage: `Produto não encontrado: ${item.name || item.productId}`,
      });
    }

    const realPrice = parseFloat(realProduct.price);
    const quantity = parseInt(item.quantity);
    let realSubtotal = realPrice * quantity;

    // Complementos
    const validatedComplements: any[] = [];
    if (item.complements && Array.isArray(item.complements)) {
      for (const complement of item.complements) {
        if (complement.quantity > 0) {
          const realComplement = realProduct.complements?.find((c: any) => c.name === complement.name);
          if (realComplement) {
            const complementPrice = parseFloat(realComplement.price);
            const complementSubtotal = complementPrice * complement.quantity * quantity;
            realSubtotal += complementSubtotal;
            validatedComplements.push({
              name: complement.name,
              quantity: complement.quantity,
              price: complementPrice,
              subtotal: complementSubtotal,
            });
          }
        }
      }
    }

    validatedItems.push({
      productId: realProduct._id,
      name: realProduct.name,
      quantity,
      price: realPrice,
      subtotal: realSubtotal,
      complements: validatedComplements,
    });

    calculatedTotal += realSubtotal;
  }

  calculatedTotal = parseFloat(calculatedTotal.toFixed(2));

  if (calculatedTotal <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Total deve ser maior que zero" });
  }

  // Verificar estoque
  const inventory = db.collection("inventory");
  for (const item of validatedItems) {
    const productIdStr = item.productId instanceof ObjectId
      ? item.productId.toString()
      : String(item.productId);
    const inventoryItem = await inventory.findOne({ productId: productIdStr });
    if (inventoryItem && inventoryItem.currentStock < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Estoque insuficiente para ${item.name}. Disponível: ${inventoryItem.currentStock}`,
      });
    }
  }

  const orderNumber = `PDV${Date.now().toString().slice(-8)}`;

  const order: any = {
    orderNumber,
    type: "balcao", // diferencia de pedidos delivery
    attendant: userData.name || userData.email || "Atendente",
    customerInfo: {
      name: customerName ? sanitizeString(customerName).slice(0, 100) : "Cliente Balcão",
      phone: "",
      email: "",
    },
    items: validatedItems,
    deliveryInfo: {
      address: "Retirada no balcão",
      deliveryFee: 0,
    },
    paymentMethod,
    changeFor: paymentMethod === "dinheiro" && changeFor ? parseFloat(changeFor) : null,
    totalAmount: calculatedTotal,
    discount: 0,
    coupon: null,
    notes: notes ? sanitizeString(notes).slice(0, 500) : "",
    status: "confirmed", // PDV já começa como confirmado
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const orders = db.collection("orders");
  const result = await orders.insertOne(order);

  // Notificar dashboard via SSE
  try {
    const orderWithId = { ...order, _id: result.insertedId };
    const { notifyNewOrder } = await import("../../utils/sse-notifications.js");
    if (notifyNewOrder && typeof notifyNewOrder === "function") {
      await notifyNewOrder(orderWithId);
    }
  } catch (err) {
    console.error("[PDV] Erro ao notificar SSE:", err);
  }

  // Atualizar estoque
  const movements = db.collection("inventory_movements");
  for (const item of validatedItems) {
    const productIdStr = item.productId instanceof ObjectId
      ? item.productId.toString()
      : String(item.productId);
    try {
      await inventory.updateOne(
        { productId: productIdStr },
        {
          $inc: { currentStock: -item.quantity, totalSold: item.quantity },
          $set: { lastUpdated: new Date(), updatedAt: new Date() },
        }
      );
      await movements.insertOne({
        productId: productIdStr,
        type: "out",
        quantity: item.quantity,
        reason: `Venda PDV - Pedido ${orderNumber}`,
        orderId: result.insertedId.toString(),
        createdAt: new Date(),
      });
    } catch (err) {
      console.error("[PDV] Erro ao atualizar estoque:", err);
    }
  }

  return {
    success: true,
    orderNumber,
    orderId: result.insertedId.toString(),
    total: calculatedTotal,
    changeAmount: order.changeFor ? parseFloat((order.changeFor - calculatedTotal).toFixed(2)) : null,
  };
});
