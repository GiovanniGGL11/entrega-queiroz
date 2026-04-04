import bcrypt from 'bcryptjs'
import { connectToDatabase } from '../../utils/db'
import { signCustomerToken } from '../../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email e senha são obrigatórios' })
  }

  const { db } = await connectToDatabase()
  const customers = db.collection('customers')

  const customer = await customers.findOne({ email })
  if (!customer || !customer.password) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas' })
  }

  const valid = await bcrypt.compare(password, customer.password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas' })
  }

  const token = signCustomerToken({ customerId: customer._id.toString(), email: customer.email })

  return {
    success: true,
    token,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      number: customer.number,
      neighborhood: customer.neighborhood,
      city: customer.city,
      zipCode: customer.zipCode
    }
  }
})
