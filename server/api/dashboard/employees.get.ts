// server/api/dashboard/employees.get.ts
import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })

  let decoded: any
  try {
    decoded = verifyUserToken(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Token inválido' })
  }

  const role = decoded.role || 'owner'
  if (role !== 'owner') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  try {
    const db = await getDB()
    const users = db.collection('users')
    const employees = await users.find(
      { role: 'employee' },
      { projection: { password: 0 } }
    ).toArray()

    return employees.map(e => ({
      _id: e._id.toString(),
      name: e.name || '',
      email: e.email,
      role: e.role,
      createdAt: e.createdAt
    }))
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Erro ao buscar funcionários' })
  }
})
