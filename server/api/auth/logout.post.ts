import { clearAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  console.log('🔓 Logout iniciado')

  // Limpar cookies de autenticação
  clearAuthCookie(event)

  console.log('✅ Logout concluído')
  return { 
    success: true, 
    message: 'Logout realizado com sucesso',
    clearLocalStorage: true // Flag para o cliente limpar localStorage
  }
})