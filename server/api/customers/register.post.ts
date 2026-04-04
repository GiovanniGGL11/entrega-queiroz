import bcrypt from 'bcryptjs'
import { connectToDatabase } from '../../utils/db'
import { signCustomerToken } from '../../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, phone, password, address, number, neighborhood, city, zipCode } = body

  if (!name || !email || !phone || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Nome, email, telefone e senha são obrigatórios' })
  }

  const { db } = await connectToDatabase()
  const customers = db.collection('customers')

  const existing = await customers.findOne({ email })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Este email já está cadastrado' })
  }

  const hash = await bcrypt.hash(password, 10)

  const result = await customers.insertOne({
    name,
    email,
    phone,
    password: hash,
    address: address || '',
    number: number || '',
    neighborhood: neighborhood || '',
    city: city || '',
    zipCode: zipCode || '',
    createdAt: new Date()
  })

  const token = signCustomerToken({ customerId: result.insertedId.toString(), email })

  return {
    success: true,
    token,
    customer: { name, email, phone }
  }
})
