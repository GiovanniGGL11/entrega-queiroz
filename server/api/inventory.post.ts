// server/api/inventory.post.ts
import { getDB } from "../utils/db";
import { verifyUserToken } from "../utils/auth";
import { getRequestHeader, createError } from 'h3';

const VALID_UNITS = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'pct', 'fd']
const VALID_TYPES = ['produto', 'ingrediente']

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const body = await readBody(event)
  const { name, type, category, unit, productId, initialStock, minStock, costPrice } = body

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Nome é obrigatório' })
  if (!VALID_TYPES.includes(type)) throw createError({ statusCode: 400, message: 'Tipo inválido' })
  if (!category?.trim()) throw createError({ statusCode: 400, message: 'Categoria é obrigatória' })
  if (!VALID_UNITS.includes(unit)) throw createError({ statusCode: 400, message: 'Unidade inválida' })

  try {
    const db = await getDB()

    // Verificar duplicata pelo nome na mesma categoria
    const existing = await db.collection('inventory').findOne({ name: name.trim(), category: category.trim() })
    if (existing) throw createError({ statusCode: 409, message: 'Já existe um item com esse nome nesta categoria' })

    const doc: any = {
      name: name.trim(),
      type,
      category: category.trim(),
      unit,
      productId: productId || null,
      currentStock: Math.max(0, Number(initialStock) || 0),
      minStock: Math.max(0, Number(minStock) || 0),
      costPrice: Math.max(0, Number(costPrice) || 0),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('inventory').insertOne(doc)

    // Registrar movimentação inicial se houver estoque
    if (doc.currentStock > 0) {
      await db.collection('inventory_movements').insertOne({
        inventoryId: result.insertedId,
        itemName: doc.name,
        category: doc.category,
        type: 'entrada',
        quantity: doc.currentStock,
        previousStock: 0,
        newStock: doc.currentStock,
        reason: 'Estoque inicial',
        createdAt: new Date()
      })
    }

    return { success: true, _id: result.insertedId.toString(), ...doc, _id: result.insertedId.toString() }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao criar item de estoque' })
  }
})
