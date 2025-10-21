import bcrypt from 'bcryptjs'
import { connectDB } from '../../utils/db'
import { setAuthCookie, signUserToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = body

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email e senha são obrigatórios'
      })
    }

    // Conectar ao banco
    const db = await connectDB()
    const usersCollection = db.collection('users')

    // Buscar usuário
    const user = await usersCollection.findOne({ email })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciais inválidas'
      })
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciais inválidas'
      })
    }

    // Gerar token JWT e salvar no cookie httpOnly
    const token = signUserToken({ userId: user._id.toString(), email: user.email })
    setAuthCookie(event, token)

    return {
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user._id.toString(),
        email: user.email
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Erro no login:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar login'
    })
  }
})

