import bcrypt from 'bcryptjs'
import { connectDB } from '../../utils/db'
import { setAuthCookie, signUserToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  console.log('[login.ts] Requisição recebida')
  try {
    const body = await readBody(event)
    const { email, password } = body
    console.log('[login.ts] Email:', email)

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email e senha são obrigatórios'
      })
    }

    // Conectar ao banco
    console.log('[login.ts] Conectando ao banco...')
    const db = await connectDB()
    console.log('[login.ts] Banco conectado')
    const usersCollection = db.collection('users')

    // Buscar usuário
    const user = await usersCollection.findOne({ email })
    console.log('[login.ts] Usuário encontrado:', !!user)

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

    // Gerar token JWT incluindo role e name
    const role = (user.role === 'employee') ? 'employee' : 'owner'
    const token = signUserToken({ userId: user._id.toString(), email: user.email, role, name: user.name || '' })

    // Na produção (Vercel), não usar cookies httpOnly devido a limitações
    if (process.env.NODE_ENV !== 'production') {
      setAuthCookie(event, token)
    }

    return {
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user._id.toString(),
        email: user.email,
        role,
        name: user.name || ''
      },
      token: token
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

