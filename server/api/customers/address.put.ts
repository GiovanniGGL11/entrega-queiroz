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
  const { address, number, neighborhood, city, zipCode } = body

  const { db } = await connectToDatabase()
  await db.collection('customers').updateOne(
    { _id: new ObjectId(decoded.customerId) },
    { $set: { address: address || '', number: number || '', neighborhood: neighborhood || '', city: city || '', zipCode: zipCode || '' } }
  )

  return { ok: true }
})
