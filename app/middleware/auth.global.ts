export default defineNuxtRouteMiddleware(async (to, from) => {
  // Páginas públicas que não precisam de autenticação
  const publicPages = ['/login', '/', '/checkout']

  // Se está tentando acessar página pública, permitir
  if (publicPages.includes(to.path)) {
    return
  }

  // Se estiver no server, valide de forma autoritativa via API usando os cookies do request
  if (process.server) {
    try {
      const headers = useRequestHeaders(['cookie'])
      await $fetch('/api/auth/me', { headers })
      // Autenticado no SSR, permitir
      return
    } catch (error) {
      return navigateTo('/login')
    }
  }

  // Client: validação autoritativa via API (sem flags locais)

  // Todas as outras rotas (incluindo /dashboard/*) requerem autenticação
  try {
    // Tentar múltiplas vezes com pequenos delays para casos de propagação de cookie
    let lastError = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Preparar headers com cache control
        const headers: any = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
        
        await $fetch(`/api/auth/me?t=${Date.now()}`, {
          credentials: 'include',
          headers
        })
        return // Sucesso, sair do middleware
      } catch (error) {
        lastError = error
        
        // Se não é a última tentativa, aguardar um pouco
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
    
    // Todas as tentativas falharam
    return navigateTo('/login')
  } catch (error) {
    // Erro inesperado
    return navigateTo('/login')
  }
})

