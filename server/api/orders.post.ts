// server/api/orders.post.ts
import { getDB } from "../utils/db";
import { ObjectId } from "mongodb";
import { RateLimiter, sanitizeString, InputValidator } from "../utils/security";
import { getRequestHeader } from "h3";

// Função para calcular distância entre duas coordenadas (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default defineEventHandler(async (event) => {
  const ip = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  RateLimiter.enforce(`order:${ip}`, 15, 60_000)

  const body = await readBody(event);
  const {
    customerInfo,
    items,
    deliveryInfo,
    paymentMethod,
    notes,
    couponCode
  } = body;

  // Validações básicas
  if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
    throw createError({
      statusCode: 400,
      message: "Informações do cliente são obrigatórias",
    });
  }

  // Sanitizar dados do cliente
  customerInfo.name = sanitizeString(customerInfo.name).slice(0, 100)
  customerInfo.phone = sanitizeString(customerInfo.phone).slice(0, 20)
  customerInfo.email = sanitizeString(customerInfo.email || '').slice(0, 254)

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

  // Remover validação do totalAmount do frontend - será calculado pelo backend

  try {
    const db = await getDB();
    
    // Verificar se a loja está aberta
    const settings = db.collection("settings");
    const storeConfig = await settings.findOne({ _id: "store-config" });
    
    if (storeConfig) {
      let isOpen = false;
      
      // Verificar override manual primeiro
      if (storeConfig.manualOverride !== undefined && storeConfig.manualOverride !== null) {
        isOpen = storeConfig.manualOverride;
      } else {
        // Calcular baseado nos horários
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const todaySchedule = storeConfig.openingHours?.find((h: any) => h.day === currentDay);
        
        if (todaySchedule && todaySchedule.enabled) {
          isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
        }
      }
      
      if (!isOpen) {
        throw createError({
          statusCode: 403,
          message: "A loja está fechada no momento. Pedidos não podem ser realizados.",
        });
      }
      
      // Verificar se o CEP está na lista de restritos
      const restrictedZipCodes = storeConfig.restrictedZipCodes || [];
      if (restrictedZipCodes.length > 0 && deliveryInfo.zipCode) {
        const cleanZipCode = deliveryInfo.zipCode.replace(/\D/g, '');
        if (cleanZipCode.length === 8) {
          const formattedZipCode = cleanZipCode.substring(0, 5) + '-' + cleanZipCode.substring(5, 8);
          const isRestricted = restrictedZipCodes.some((restricted: string) => {
            const restrictedClean = restricted.replace(/\D/g, '');
            return restrictedClean === cleanZipCode || restricted === formattedZipCode;
          });
          
          if (isRestricted) {
            throw createError({
              statusCode: 403,
              message: "Desculpe, não entregamos neste CEP. Entrega não disponível para esta região.",
            });
          }
        }
      }
    }
    const products = db.collection("products");
    
    // VALIDAÇÃO DE SEGURANÇA: Verificar preços e produtos reais
    let calculatedTotal = 0;
    const validatedItems = [];
    
    for (const item of items) {
      // Validar estrutura básica do item
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
      
      // Usar APENAS dados reais do banco de dados (ignorar completamente dados do frontend)
      const realPrice = parseFloat(realProduct.price);
      const quantity = parseInt(item.quantity);
      let realSubtotal = realPrice * quantity;
      
      // Calcular preços dos complementos usando dados reais do banco
      const validatedComplements = [];
      if (item.complements && Array.isArray(item.complements)) {
        for (const complement of item.complements) {
          if (complement.quantity > 0) {
            // Buscar complemento real no banco de dados
            const realComplement = realProduct.complements?.find(c => c.name === complement.name);
            if (realComplement) {
              const complementPrice = parseFloat(realComplement.price);
              const complementSubtotal = complementPrice * complement.quantity * quantity;
              realSubtotal += complementSubtotal;
              
              validatedComplements.push({
                name: complement.name,
                quantity: complement.quantity,
                price: complementPrice,
                subtotal: complementSubtotal
              });
            }
          }
        }
      }
      
      // Usar dados reais do banco de dados
      validatedItems.push({
        productId: realProduct._id,
        name: realProduct.name,
        quantity: quantity,
        price: realPrice,
        subtotal: realSubtotal,
        complements: validatedComplements
      });
      
      calculatedTotal += realSubtotal;
    }
    
    // CALCULAR taxa de entrega baseado no endereço (não confiar no frontend)
    let realDeliveryFee = 0;
    let deliveryZone = '';
    let estimatedTime = '30-45 min';
    
    // Usar storeConfig que já foi obtido anteriormente
    const storeSettings = storeConfig;
    
    
    if (deliveryInfo.latitude && deliveryInfo.longitude) {
      // Calcular usando coordenadas (mais preciso)
      if (storeSettings && storeSettings.deliveryZones) {
        const storeLat = storeSettings.location?.latitude || -23.5505;
        const storeLng = storeSettings.location?.longitude || -46.6333;
        
        const distance = calculateDistance(
          storeLat, storeLng,
          deliveryInfo.latitude, deliveryInfo.longitude
        );
        
        // Encontrar zona de entrega baseada na distância
        // Ordenar zonas por distância máxima (menor primeiro) para pegar a zona mais próxima
        const sortedZones = [...storeSettings.deliveryZones].sort((a, b) => a.maxDistance - b.maxDistance);
        const zone = sortedZones.find(z => distance <= z.maxDistance);
        if (zone) {
          realDeliveryFee = zone.fee;
          deliveryZone = zone.name || zone.label;
          estimatedTime = `${storeSettings.deliveryMinTime || 30}-${storeSettings.deliveryMaxTime || 60} min`;
        } else {
          throw createError({
            statusCode: 400,
            message: "Endereço fora da área de entrega",
          });
        }
      }
    } else {
      // Fallback: usar a mesma lógica da API de cálculo de entrega
      if (storeSettings && storeSettings.deliveryZones && storeSettings.deliveryZones.length > 0) {
        const zipCode = deliveryInfo.zipCode?.replace(/\D/g, '');
        
        if (zipCode && zipCode.length === 8) {
          const cepPrefix = zipCode.substring(0, 5); // Primeiros 5 dígitos do CEP
          
          // Encontrar zona de entrega correspondente ao CEP
          let selectedZone = null;
          
          
          // Primeiro, tentar encontrar por cepRanges se existirem
          for (const zone of storeSettings.deliveryZones) {
            if (zone.cepRanges && zone.cepRanges.length > 0) {
              if (zone.cepRanges.some((range) => {
                if (range.includes('-')) {
                  // Range format: "08570-08580"
                  const [start, end] = range.split('-').map((cep) => cep.substring(0, 5));
                  const matches = cepPrefix >= start && cepPrefix <= end;
                  return matches;
                } else {
                  // Single prefix format: "08" (2 digits) or "08574" (5 digits)
                  const rangePrefix = range.substring(0, Math.min(range.length, cepPrefix.length));
                  const matches = cepPrefix.startsWith(rangePrefix);
                  return matches;
                }
              })) {
                selectedZone = zone;
                break;
              }
            }
          }
          
          // Se não encontrou por CEP e não há cepRanges configurados, usar a MESMA lógica do frontend
          if (!selectedZone) {
            // Para CEPs não mapeados, usar uma lógica inteligente baseada no CEP (mesma do frontend)
            if (storeSettings.deliveryZones.length > 0) {
              // Determinar zona baseada no prefixo do CEP
              // CEPs que começam com 08 são da região metropolitana de São Paulo
              // Usar zona intermediária para esses CEPs
              let selectedZoneIndex = 0; // Zona padrão (mais próxima)
              
              if (cepPrefix.startsWith('08')) {
                // Para região metropolitana, usar zona intermediária se disponível
                if (storeSettings.deliveryZones.length >= 2) {
                  selectedZoneIndex = 1; // Segunda zona (intermediária)
                }
              } else if (cepPrefix.startsWith('01') || cepPrefix.startsWith('02') || 
                         cepPrefix.startsWith('03') || cepPrefix.startsWith('04') || 
                         cepPrefix.startsWith('05') || cepPrefix.startsWith('06') || 
                         cepPrefix.startsWith('07')) {
                // Para São Paulo capital, usar zona mais próxima
                selectedZoneIndex = 0;
              } else {
                // Para outras regiões muito distantes, usar zona padrão
                selectedZoneIndex = 0;
              }
              
              selectedZone = storeSettings.deliveryZones[selectedZoneIndex];
            }
          }
          
          realDeliveryFee = selectedZone.fee;
          deliveryZone = selectedZone.name || selectedZone.label || "Zona Padrão";
          estimatedTime = `${storeSettings.deliveryMinTime || 30}-${storeSettings.deliveryMaxTime || 60} min`;
        } else {
          // CEP inválido, usar primeira zona
          const defaultZone = storeSettings.deliveryZones[0];
          realDeliveryFee = defaultZone.fee;
          deliveryZone = defaultZone.name || defaultZone.label || "Zona Padrão";
          estimatedTime = `${storeSettings.deliveryMinTime || 30}-${storeSettings.deliveryMaxTime || 60} min`;
        }
      } else if (storeSettings) {
        // Último fallback: usar taxa padrão das configurações
        realDeliveryFee = storeSettings.deliveryFee || 0;
        estimatedTime = `${storeSettings.deliveryMinTime || 30}-${storeSettings.deliveryMaxTime || 60} min`;
        deliveryZone = "Taxa Padrão";
      }
    }
    
    calculatedTotal += realDeliveryFee;

    // Aplicar cupom de desconto
    let appliedCoupon: any = null;
    let discountAmount = 0;
    if (couponCode && couponCode.trim()) {
      const coupons = db.collection("coupons");
      const coupon = await coupons.findOne({ code: couponCode.trim().toUpperCase() });
      if (coupon && coupon.active) {
        const subtotalSemFrete = calculatedTotal - realDeliveryFee;
        const couponStarted = !coupon.startsAt || new Date(coupon.startsAt) <= new Date();
        if (couponStarted && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())) {
          if (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) {
            if (subtotalSemFrete >= (coupon.minOrder || 0)) {
              if (coupon.type === 'percentage') {
                discountAmount = subtotalSemFrete * (coupon.value / 100);
              } else {
                discountAmount = coupon.value;
              }
              discountAmount = Math.min(discountAmount, subtotalSemFrete);
              discountAmount = parseFloat(discountAmount.toFixed(2));
              calculatedTotal = parseFloat((calculatedTotal - discountAmount).toFixed(2));
              appliedCoupon = {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discountAmount
              };
            }
          }
        }
      }
    }

    // Validação final: garantir que o total calculado seja válido
    if (calculatedTotal <= 0) {
      throw createError({
        statusCode: 400,
        message: "Valor total calculado deve ser maior que zero",
      });
    }
    
    // Usar APENAS o total calculado pelo backend (ignorar total do frontend)
    // O backend é a única fonte de verdade para preços e cálculos
    
    const orders = db.collection("orders");
    const inventory = db.collection("inventory");
    
    // Verificar estoque dos produtos usando dados validados
    for (const item of validatedItems) {
      if (item.productId) {
        // O productId no inventário é armazenado como string, então converter ObjectId para string
        const productIdString = item.productId instanceof ObjectId 
          ? item.productId.toString() 
          : String(item.productId);
        
        const inventoryItem = await inventory.findOne({ productId: productIdString });
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
        number: deliveryInfo.number?.trim() || '',
        neighborhood: deliveryInfo.neighborhood?.trim() || '',
        city: deliveryInfo.city?.trim() || '',
        zipCode: deliveryInfo.zipCode?.trim() || '',
        complement: deliveryInfo.complement?.trim() || '',
        latitude: deliveryInfo.latitude,
        longitude: deliveryInfo.longitude,
        deliveryFee: realDeliveryFee,
        deliveryZone: deliveryZone,
        estimatedTime: estimatedTime
      },
      paymentMethod: paymentMethod || 'dinheiro',
      totalAmount: calculatedTotal,
      discount: discountAmount,
      coupon: appliedCoupon,
      notes: sanitizeString(notes || '').slice(0, 500),
      status: 'pending', // pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await orders.insertOne(order);

    // Incrementar uso do cupom
    if (appliedCoupon) {
      await db.collection("coupons").updateOne(
        { code: appliedCoupon.code },
        { $inc: { usedCount: 1 } }
      );
    }

    // Notificar clientes conectados sobre o novo pedido (em tempo real)
    try {
      // Adicionar _id ao pedido para a notificação
      const orderWithId = {
        ...order,
        _id: result.insertedId
      }
      
      // Importar função de notificação do utilitário compartilhado
      const { notifyNewOrder } = await import('../utils/sse-notifications.js')
      
      if (notifyNewOrder && typeof notifyNewOrder === 'function') {
        await notifyNewOrder(orderWithId)
        console.log('[Orders POST] Notificação de novo pedido enviada via SSE')
      } else {
        console.warn('[Orders POST] Função notifyNewOrder não encontrada')
      }
    } catch (error) {
      console.error('[Orders POST] Erro ao notificar sobre novo pedido:', error)
      // Não falhar a criação do pedido se a notificação falhar
    }

    // Atualizar estoque dos produtos usando dados validados
    const movements = db.collection("inventory_movements");
    for (const item of validatedItems) {
      if (item.productId) {
        try {
          // O productId no inventário é armazenado como string, então converter ObjectId para string
          const productIdString = item.productId instanceof ObjectId
            ? item.productId.toString()
            : String(item.productId);

          const inventoryItem = await inventory.findOne({ productId: productIdString });

          const updateResult = await inventory.updateOne(
            { productId: productIdString },
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

          if (updateResult.matchedCount === 0) {
            console.warn(`[Orders POST] Produto ${productIdString} não encontrado no inventário para atualização de estoque`);
          } else {
            console.log(`[Orders POST] Estoque atualizado para produto ${productIdString}: -${item.quantity} unidades`);
            // Registrar movimentação de saída por venda
            if (inventoryItem) {
              await movements.insertOne({
                inventoryId: inventoryItem._id,
                productId: productIdString,
                productName: item.name,
                type: 'saida',
                quantity: item.quantity,
                previousStock: inventoryItem.currentStock,
                newStock: inventoryItem.currentStock - item.quantity,
                reason: `Venda - Pedido ${orderNumber}`,
                costPrice: inventoryItem.costPrice || 0,
                notes: '',
                orderId: result.insertedId,
                orderNumber: orderNumber,
                createdAt: new Date(),
                createdBy: 'system'
              });
            }
          }
        } catch (stockError) {
          // Log do erro mas não falhar o pedido
          console.error(`[Orders POST] Erro ao atualizar estoque do produto ${item.productId}:`, stockError);
        }
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
