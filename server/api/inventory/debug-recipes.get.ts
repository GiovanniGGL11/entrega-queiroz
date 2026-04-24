// server/api/inventory/debug-recipes.get.ts — TEMPORÁRIO, remover após diagnóstico
import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const db = await getDB()
  const products = await db.collection('products').find(
    { 'recipe.0': { $exists: true } },
    { projection: { name: 1, recipe: 1 } }
  ).toArray()

  const inventory = await db.collection('inventory').find({}, { projection: { _id: 1, name: 1 } }).toArray()
  const invMap = new Map(inventory.map(i => [i._id.toString(), i.name]))

  return products.map(p => ({
    product: p.name,
    recipe: (p.recipe || []).map((r: any) => ({
      storedName: r.name,
      inventoryId: r.inventoryId,
      inventoryIdValid: !!r.inventoryId,
      currentInventoryName: invMap.get(r.inventoryId) || '— NÃO ENCONTRADO —'
    }))
  }))
})
