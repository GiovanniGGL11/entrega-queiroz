import bcrypt from 'bcryptjs'
import { connectToDatabase } from '../../utils/db'
import { signCustomerToken } from '../../utils/customer-auth'
import { RateLimiter, InputValidator, sanitizeName } from '../../utils/security'
import { getRequestHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const ip = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  RateLimiter.enforce(`register:${ip}`, 5, 60_000, 600_000)

  const body = await readBody(event)

  const name = sanitizeName(body?.name, 'Nome', 100)
  const email = InputValidator.validateEmail(body?.email)
  const phone = InputValidator.validatePhone(body?.phone)
  const password = InputValidator.validatePassword(body?.password)
  const address = InputValidator.validateOptionalString(body?.address, 'Endereço', 200)
  const number = InputValidator.validateOptionalString(body?.number, 'Número', 20)
  const neighborhood = InputValidator.validateOptionalString(body?.neighborhood, 'Bairro', 100)
  const city = InputValidator.validateOptionalString(body?.city, 'Cidade', 100)
  const zipCode = body?.zipCode ? InputValidator.validateCEP(body.zipCode) : ''

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
    address,
    number,
    neighborhood,
    city,
    zipCode,
    createdAt: new Date()
  })

  const token = signCustomerToken({ customerId: result.insertedId.toString(), email })

  return {
    success: true,
    token,
    customer: { name, email, phone }
  }
})
