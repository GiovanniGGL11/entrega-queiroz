// server/api/dashboard/me.get.ts — retorna dados do usuário logado incluindo permissões
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
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

  try {
    const db = await getDB()
    const users = db.collection('users')
    const user = await users.findOne(
      { _id: new ObjectId(decoded.userId || decoded.id) },
      { projection: { password: 0 } }
    )

    if (!user) throw createError({ statusCode: 404, message: 'Usuário não encontrado' })

    const defaultPermissions = ['orders', 'pdv', 'motoboys', 'inventory']

    return {
      _id: user._id.toString(),
      name: user.name || '',
      email: user.email,
      role: user.role,
      permissions: user.role === 'employee' ? (user.permissions ?? defaultPermissions) : defaultPermissions
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao buscar dados do usuário' })
  }
})
