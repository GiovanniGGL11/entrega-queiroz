import { getDB } from '../utils/db'
import { verifyUserToken } from '../utils/auth'
import { getRequestHeader, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const db = await getDB()
  const motoboys = await db.collection('motoboys').find({}).sort({ createdAt: -1 }).toArray()
  return motoboys.map((m: any) => ({ ...m, _id: m._id.toString() }))
})
