import { getQuery, sendRedirect } from 'h3'
import { connectToDatabase } from '../../../utils/db'
import { signUserToken } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const { code, error } = getQuery(event)

  if (error || !code) {
    return sendRedirect(event, '/login?error=google_cancelado')
  }

  const config = useRuntimeConfig()

  try {
    // Trocar o code pelo access_token do Google
    const tokenData: any = await $fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri,
        grant_type: 'authorization_code'
      }
    })

    // Buscar informações do usuário no Google
    const userInfo: any = await $fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })

    if (!userInfo.email) {
      return sendRedirect(event, '/login?error=email_nao_encontrado')
    }

    // Buscar ou criar usuário no banco
    const { db } = await connectToDatabase()
    const users = db.collection('users')

    let user = await users.findOne({ email: userInfo.email })

    if (!user) {
      const result = await users.insertOne({
        email: userInfo.email,
        name: userInfo.name || '',
        googleId: userInfo.id,
        createdAt: new Date()
      })
      user = { _id: result.insertedId, email: userInfo.email }
    }

    // Google OAuth é apenas para clientes — nunca dá acesso ao admin
    const name = encodeURIComponent(userInfo.name || '')
    const email = encodeURIComponent(userInfo.email)
    return sendRedirect(event, `/auth/google-cliente?name=${name}&email=${email}`)
  } catch (err: any) {
    console.error('[Google OAuth] Erro:', err.message)
    return sendRedirect(event, '/login?error=falha_google')
  }
})
