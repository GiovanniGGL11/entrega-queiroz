import { getDB } from '../../utils/db'
import { verifyUserToken } from '../../utils/auth'
import { getRequestHeader, createError, readBody } from 'h3'
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

  const body = await readBody(event)
  const { nome, telefone, cpf, placa, foto, status, trabalhouHoje } = body

  if (!nome || !telefone) {
    throw createError({ statusCode: 400, statusMessage: 'Nome e telefone são obrigatórios' })
  }

  const db = await getDB()
  await db.collection('motoboys').updateOne(
    { _id: new ObjectId(id) },
    { $set: {
      nome: nome.trim(),
      telefone: telefone.trim(),
      cpf: cpf?.trim() || '',
      placa: placa?.trim() || '',
      foto: foto || '',
      status: status ?? true,
      trabalhouHoje: trabalhouHoje ?? false,
      updatedAt: new Date()
    }}
  )

  return { success: true }
})
