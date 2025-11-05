// Função helper para autenticação direta
export function createAuthenticatedHandler(handler: Function) {
  return async (event: any) => {
    // Autenticação direta sem middleware
    const authHeader = getRequestHeader(event, 'authorization')
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token de autenticação necessário'
      })
    }
    
    // Verificar token
    try {
      const decoded = verifyUserToken(token)
      // Token válido, continuar
    } catch (jwtError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token inválido ou expirado'
      })
    }
    
    // Executar o handler original
    return handler(event)
  }
}










