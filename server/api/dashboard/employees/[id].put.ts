// server/api/dashboard/employees/[id].put.ts
import { getDB } from "../../../utils/db";
import { ObjectId } from "mongodb";
import { verifyUserToken } from "../../../utils/auth";
import { getRequestHeader, createError } from 'h3';

const ALLOWED_PERMISSIONS = ['orders', 'pdv', 'motoboys', 'inventory', 'customers', 'coupons', 'products', 'categories']

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

  if (decoded.role === 'employee') {
    throw createError({ statusCode: 403, statusMessage: 'Somente o dono pode editar permissões' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'ID inválido' })
  }

  const body = await readBody(event)

  const update: Record<string, any> = {}

  if (body.permissions !== undefined) {
    update.permissions = (body.permissions || []).filter((p: string) => ALLOWED_PERMISSIONS.includes(p))
  }

  if (body.photo !== undefined) {
    // Validar tamanho do base64 (máx ~2MB)
    if (body.photo && body.photo.length > 3 * 1024 * 1024) {
      throw createError({ statusCode: 400, message: 'Foto muito grande. Máximo 2MB.' })
    }
    update.photo = body.photo || null
  }

  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, message: 'Nenhum campo para atualizar' })
  }

  try {
    const db = await getDB()
    const users = db.collection('users')

    const employee = await users.findOne({ _id: new ObjectId(id), role: 'employee' })
    if (!employee) {
      throw createError({ statusCode: 404, message: 'Funcionário não encontrado' })
    }

    await users.updateOne({ _id: new ObjectId(id) }, { $set: update })

    return { success: true, ...update }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao atualizar permissões' })
  }
})
