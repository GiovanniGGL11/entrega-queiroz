// server/api/dashboard/employees.post.ts
import bcrypt from 'bcryptjs'
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
    throw createError({ statusCode: 403, statusMessage: 'Somente o dono pode cadastrar funcionários' })
  }

  const body = await readBody(event)
  const { name, email, password } = body

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, message: 'Nome, email e senha são obrigatórios' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, message: 'Senha deve ter no mínimo 6 caracteres' })
  }

  try {
    const db = await getDB()
    const users = db.collection('users')

    const existing = await users.findOne({ email: email.trim().toLowerCase() })
    if (existing) {
      throw createError({ statusCode: 409, message: 'Este email já está em uso' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await users.insertOne({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'employee',
      createdAt: new Date()
    })

    return {
      success: true,
      message: 'Funcionário cadastrado com sucesso',
      employee: {
        _id: result.insertedId.toString(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'employee',
        createdAt: new Date()
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao cadastrar funcionário' })
  }
})
