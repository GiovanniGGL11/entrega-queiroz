import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '../../utils/db'

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

    // Gerar token JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Salvar token em cookie httpOnly
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    })

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

