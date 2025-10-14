export default defineEventHandler(async (event) => {
  // Remover cookie de autenticação
  deleteCookie(event, 'auth_token', {
    path: '/'
  })
  
  return {
    success: true,
    message: 'Logout realizado com sucesso'
  }
})

