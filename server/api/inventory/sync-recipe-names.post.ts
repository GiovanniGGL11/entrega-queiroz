// server/api/inventory/sync-recipe-names.post.ts
// Sincroniza os nomes dos ingredientes em todas as recipes de produtos
// com os nomes atuais do estoque (corrige nomes desatualizados)
import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  try {
    const db = await getDB()

    // Busca todos os itens do estoque
    const inventoryItems = await db.collection('inventory').find({}).toArray()
    const nameMap = new Map(inventoryItems.map(i => [i._id.toString(), i.name]))

    // Busca todos os produtos que têm recipe
    const products = await db.collection('products').find({ recipe: { $exists: true, $not: { $size: 0 } } }).toArray()

    let updated = 0
    for (const product of products) {
      if (!Array.isArray(product.recipe)) continue
      let changed = false
      const newRecipe = product.recipe.map((r: any) => {
        const correctName = nameMap.get(r.inventoryId)
        if (correctName && correctName !== r.name) {
          changed = true
          return { ...r, name: correctName }
        }
        return r
      })
      if (changed) {
        await db.collection('products').updateOne(
          { _id: product._id },
          { $set: { recipe: newRecipe } }
        )
        updated++
      }
    }

    return { success: true, productsUpdated: updated }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao sincronizar nomes' })
  }
})
