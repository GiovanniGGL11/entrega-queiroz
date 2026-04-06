import { getDB } from '../utils/db'
import { verifyUserToken } from '../utils/auth'
import { getRequestHeader, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const body = await readBody(event)
  const { nome, telefone, cpf, placa, status, foto } = body

  if (!nome || !telefone) {
    throw createError({ statusCode: 400, statusMessage: 'Nome e telefone são obrigatórios' })
  }

  const db = await getDB()
  const result = await db.collection('motoboys').insertOne({
    nome: nome.trim(),
    telefone: telefone.trim(),
    cpf: cpf?.trim() || '',
    placa: placa?.trim() || '',
    foto: foto || '',
    status: status ?? true,
    createdAt: new Date()
  })

  return { success: true, id: result.insertedId.toString() }
})
