import { getRequestHeader } from 'h3'
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

  const { db } = await connectToDatabase()
  const customer = await db.collection('customers').findOne({ _id: new ObjectId(decoded.customerId) })

  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: 'Cliente não encontrado' })
  }

  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone || '',
    address: customer.address || '',
    number: customer.number || '',
    neighborhood: customer.neighborhood || '',
    city: customer.city || '',
    zipCode: customer.zipCode || ''
  }
})
