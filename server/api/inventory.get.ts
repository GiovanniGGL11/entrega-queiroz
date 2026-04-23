// server/api/inventory.get.ts
import { getDB } from "../utils/db";
import { verifyUserToken } from "../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  try {
    const db = await getDB()
    const items = await db.collection('inventory').find({}).sort({ category: 1, name: 1 }).toArray()

    return items.map(i => ({
      _id: i._id.toString(),
      name: i.name || i.productName || '—',
      type: i.type || 'produto',
      category: i.category || 'Geral',
      unit: i.unit || 'un',
      productId: i.productId || null,
      currentStock: i.currentStock ?? 0,
      minStock: i.minStock ?? 0,
      costPrice: i.costPrice ?? 0,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt || i.lastUpdated
    }))
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Erro ao buscar estoque' })
  }
})
