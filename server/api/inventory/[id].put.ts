// server/api/inventory/[id].put.ts — ajuste manual de estoque ou edição do item
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) throw createError({ statusCode: 400, message: 'ID inválido' })

  const body = await readBody(event)

  try {
    const db = await getDB()
    const item = await db.collection('inventory').findOne({ _id: new ObjectId(id) })
    if (!item) throw createError({ statusCode: 404, message: 'Item não encontrado' })

    // Ajuste de estoque (entrada ou saída manual)
    if (body.adjustType !== undefined) {
      const { adjustType, quantity, reason } = body
      if (!['entrada', 'saida'].includes(adjustType)) throw createError({ statusCode: 400, message: 'Tipo de ajuste inválido' })
      const qty = Number(quantity)
      if (!qty || qty <= 0) throw createError({ statusCode: 400, message: 'Quantidade deve ser maior que zero' })

      const previousStock = item.currentStock ?? 0
      let newStock = adjustType === 'entrada' ? previousStock + qty : previousStock - qty
      if (newStock < 0) newStock = 0

      await db.collection('inventory').updateOne(
        { _id: new ObjectId(id) },
        { $set: { currentStock: newStock, updatedAt: new Date() } }
      )

      await db.collection('inventory_movements').insertOne({
        inventoryId: new ObjectId(id),
        itemName: item.name,
        category: item.category,
        type: adjustType,
        quantity: qty,
        previousStock,
        newStock,
        reason: reason || (adjustType === 'entrada' ? 'Entrada manual' : 'Saída manual'),
        createdAt: new Date()
      })

      return { success: true, currentStock: newStock }
    }

    // Edição de campos do item
    const update: any = { updatedAt: new Date() }
    if (body.name !== undefined) update.name = body.name.trim()
    if (body.category !== undefined) update.category = body.category.trim()
    if (body.unit !== undefined) update.unit = body.unit
    if (body.minStock !== undefined) update.minStock = Math.max(0, Number(body.minStock) || 0)
    if (body.costPrice !== undefined) update.costPrice = Math.max(0, Number(body.costPrice) || 0)
    if (body.currentStock !== undefined) update.currentStock = Math.max(0, Number(body.currentStock) || 0)

    await db.collection('inventory').updateOne({ _id: new ObjectId(id) }, { $set: update })
    return { success: true }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao atualizar item' })
  }
})
