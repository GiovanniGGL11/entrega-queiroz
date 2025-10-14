// server/api/auth/logout.post.js
import { setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  console.log('🔓 Logout iniciado')

  const currentToken = getCookie(event, 'auth_token')
  console.log('Current auth_token:', currentToken ? 'exists' : 'does not exist')

  // Limpar o cookie definindo expires para passado
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  })

  // Fallback com deleteCookie
  deleteCookie(event, 'auth_token', {
    path: '/'
  })

  console.log('✅ Logout concluído')
  return { success: true, message: 'Logout realizado com sucesso' }
})