// server/api/inventory/[id].put.ts
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  // Verificar autenticação
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
  
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { currentStock, minStock, maxStock, costPrice, operation, quantity, reason } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do estoque é obrigatório",
    });
  }

  try {
    const db = await getDB();
    const inventory = db.collection("inventory");
    
    // Verificar se o item de estoque existe
    const existingItem = await inventory.findOne({ _id: new ObjectId(id) });
    if (!existingItem) {
      throw createError({
        statusCode: 404,
        message: "Item de estoque não encontrado",
      });
    }

    let updateData: any = {
      updatedAt: new Date()
    };

    // Se for uma operação específica (entrada/saída)
    if (operation && quantity !== undefined && quantity !== null) {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        throw createError({
          statusCode: 400,
          message: "Quantidade deve ser um número maior que zero",
        });
      }

      if (operation === 'add') {
        // Entrada de estoque
        updateData.currentStock = existingItem.currentStock + qty;
        updateData.totalPurchased = existingItem.totalPurchased + qty;
      } else if (operation === 'remove') {
        // Saída de estoque
        if (existingItem.currentStock < qty) {
          throw createError({
            statusCode: 400,
            message: "Estoque insuficiente",
          });
        }
        updateData.currentStock = existingItem.currentStock - qty;
        updateData.totalSold = existingItem.totalSold + qty;
      } else {
        throw createError({
          statusCode: 400,
          message: "Operação inválida. Use 'add' ou 'remove'",
        });
      }

      updateData.lastUpdated = new Date();
    } else {
      // Atualização manual dos valores
      if (currentStock !== undefined) {
        updateData.currentStock = parseInt(currentStock);
        updateData.lastUpdated = new Date();
      }
      if (minStock !== undefined) {
        updateData.minStock = parseInt(minStock);
      }
      if (maxStock !== undefined) {
        updateData.maxStock = parseInt(maxStock);
      }
      if (costPrice !== undefined) {
        updateData.costPrice = parseFloat(costPrice);
      }
    }

    const result = await inventory.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "Item de estoque não encontrado",
      });
    }

    // Buscar o item atualizado
    const updatedItem = await inventory.findOne({ _id: new ObjectId(id) });
    
    return { 
      message: "Estoque atualizado com sucesso",
      inventory: updatedItem
    };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao atualizar estoque" 
    });
  }
});
