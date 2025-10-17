import { clearAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Limpar cookies de autenticação
  clearAuthCookie(event)

  return { 
    success: true, 
    message: 'Logout realizado com sucesso',
    clearLocalStorage: true // Flag para o cliente limpar localStorage
  }
})