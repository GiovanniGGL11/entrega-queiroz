// server/api/dashboard/employees/[id].delete.ts
import { getDB } from "../../../utils/db";
import { ObjectId } from "mongodb";
import { verifyUserToken } from "../../../utils/auth";
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
    throw createError({ statusCode: 403, statusMessage: 'Somente o dono pode remover funcionários' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'ID inválido' })
  }

  try {
    const db = await getDB()
    const users = db.collection('users')

    const employee = await users.findOne({ _id: new ObjectId(id), role: 'employee' })
    if (!employee) {
      throw createError({ statusCode: 404, message: 'Funcionário não encontrado' })
    }

    await users.deleteOne({ _id: new ObjectId(id) })

    return { success: true, message: 'Funcionário removido com sucesso' }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao remover funcionário' })
  }
})
