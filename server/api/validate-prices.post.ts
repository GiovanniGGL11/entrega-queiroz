// server/api/validate-prices.post.ts
import { getDB } from "../utils/db";
import { ObjectId } from "mongodb";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { items, totalAmount, deliveryFee } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Lista de itens é obrigatória",
    });
  }

  try {
    const db = await getDB();
    const products = db.collection("products");
    
    let calculatedTotal = 0;
    const validatedItems = [];
    
    // Validar cada item
    for (const item of items) {
      if (!item.quantity) {
        throw createError({
          statusCode: 400,
          message: "Quantidade do produto é obrigatória",
        });
      }
      
      // Buscar produto real no banco de dados pelo ID (prioridade) ou pelo nome (fallback)
      let realProduct = null;
      
      if (item.productId) {
        // Tentar buscar pelo ID primeiro (mais seguro e preciso)
        try {
          realProduct = await products.findOne({ _id: new ObjectId(item.productId) });
        } catch (err) {
          // Se o ID for inválido, continuar para buscar pelo nome
          console.warn(`ID de produto inválido: ${item.productId}`);
        }
      }
      
      // Se não encontrou pelo ID, buscar pelo nome (fallback para compatibilidade)
      if (!realProduct && item.name) {
        realProduct = await products.findOne({ name: item.name.trim() });
      }
      
      if (!realProduct) {
        throw createError({
          statusCode: 400,
          message: `Produto não encontrado${item.productId ? ` (ID: ${item.productId})` : item.name ? ` (Nome: ${item.name})` : ''}`,
        });
      }
      
      const realPrice = parseFloat(realProduct.price);
      const quantity = parseInt(item.quantity);
      const subtotal = realPrice * quantity;
      
      validatedItems.push({
        productId: realProduct._id,
        name: realProduct.name,
        quantity: quantity,
        price: realPrice,
        subtotal: subtotal
      });
      
      calculatedTotal += subtotal;
    }
    
    // Adicionar taxa de entrega
    const realDeliveryFee = parseFloat(deliveryFee) || 0;
    calculatedTotal += realDeliveryFee;
    
    return {
      success: true,
      calculatedTotal: calculatedTotal,
      sentTotal: parseFloat(totalAmount) || 0,
      isValid: Math.abs(calculatedTotal - (parseFloat(totalAmount) || 0)) <= 0.01,
      validatedItems: validatedItems,
      deliveryFee: realDeliveryFee
    };
    
  } catch (err) {
    console.error('Erro na validação de preços:', err);
    throw createError({
      statusCode: 500,
      message: "Erro ao validar preços",
    });
  }
});
