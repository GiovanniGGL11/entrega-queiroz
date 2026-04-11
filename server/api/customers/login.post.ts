import bcrypt from 'bcryptjs'
import { connectToDatabase } from '../../utils/db'
import { signCustomerToken } from '../../utils/customer-auth'
import { RateLimiter, InputValidator } from '../../utils/security'
import { getRequestHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const ip = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  RateLimiter.enforce(`customer-login:${ip}`, 10, 60_000, 300_000)

  const body = await readBody(event)
  const email = InputValidator.validateEmail(body?.email)
  const password = InputValidator.validatePassword(body?.password)

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
      zipCode: customer.zipCode,
      avatar: customer.avatar || ''
    }
  }
})
