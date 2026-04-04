import { readBody, getRequestHeader } from 'h3'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '../../utils/db'
import { verifyCustomerToken } from '../../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyCustomerToken(token)

  const body = await readBody(event)
  const { avatar } = body

  if (!avatar) {
    throw createError({ statusCode: 400, statusMessage: 'Imagem não enviada' })
  }

  // Limitar tamanho: base64 de ~300KB resulta em ~400KB de string
  if (avatar.length > 500000) {
    throw createError({ statusCode: 400, statusMessage: 'Imagem muito grande. Máximo 300KB.' })
  }

  if (!avatar.startsWith('data:image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Formato inválido' })
  }

  const { db } = await connectToDatabase()
  await db.collection('customers').updateOne(
    { _id: new ObjectId(decoded.customerId) },
    { $set: { avatar } }
  )

  return { ok: true }
})
