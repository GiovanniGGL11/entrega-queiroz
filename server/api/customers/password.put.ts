import bcrypt from 'bcryptjs'
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
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Senha atual e nova senha são obrigatórias' })
  }

  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'A nova senha deve ter pelo menos 6 caracteres' })
  }

  const { db } = await connectToDatabase()
  const customer = await db.collection('customers').findOne({ _id: new ObjectId(decoded.customerId) })

  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: 'Cliente não encontrado' })
  }

  if (!customer.password) {
    throw createError({ statusCode: 400, statusMessage: 'Conta criada via Google. Use "Entrar com Google" para acessar.' })
  }

  const valid = await bcrypt.compare(currentPassword, customer.password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Senha atual incorreta' })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await db.collection('customers').updateOne(
    { _id: new ObjectId(decoded.customerId) },
    { $set: { password: hash } }
  )

  return { ok: true }
})
