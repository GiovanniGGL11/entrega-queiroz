import { clearAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Limpar cookies de autenticação (apenas em desenvolvimento)
  if (process.env.NODE_ENV !== 'production') {
    clearAuthCookie(event)
  }

  return { 
    success: true, 
    message: 'Logout realizado com sucesso',
    clearLocalStorage: true // Flag para o cliente limpar localStorage
  }
})