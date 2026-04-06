import { getDB } from '../../utils/db'
import { verifyUserToken } from '../../utils/auth'
import { getRequestHeader, createError } from 'h3'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

  const db = await getDB()
  await db.collection('motoboys').deleteOne({ _id: new ObjectId(id) })
  return { success: true }
})
