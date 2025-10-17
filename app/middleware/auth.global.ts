export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log(`🔐 Middleware auth verificando rota: ${to.path}`)

  // Páginas públicas que não precisam de autenticação
  const publicPages = ['/login', '/']

  // Se está tentando acessar página pública, permitir
  if (publicPages.includes(to.path)) {
    console.log('✅ Rota pública, acesso permitido')
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
      console.log('❌ SSR não autenticado, redirecionando para /login', error)
      return navigateTo('/login')
    }
  }

  // Client: validação autoritativa via API (sem flags locais)

  // Todas as outras rotas (incluindo /dashboard/*) requerem autenticação
  try {
    // Verificar se está autenticado - evitar cache
    console.log('🔍 Verificando autenticação no cliente...')
    
    // Tentar múltiplas vezes com pequenos delays para casos de propagação de cookie
    let lastError = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Preparar headers com token do localStorage como fallback
        const headers = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
        
        // Tentar obter token do localStorage como fallback
        if (process.client) {
          const token = localStorage.getItem('auth_token')
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
            console.log('🔑 Usando token do localStorage como fallback')
          }
        }
        
        await $fetch(`/api/auth/me?t=${Date.now()}`, {
          credentials: 'include',
          headers
        })
        console.log('✅ Autenticado, acesso permitido ao dashboard')
        return // Sucesso, sair do middleware
      } catch (error) {
        lastError = error
        console.log(`❌ Tentativa ${attempt}/3 falhou:`, error)
        
        // Se não é a última tentativa, aguardar um pouco
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
    
    // Todas as tentativas falharam
    console.log('❌ Não autenticado após 3 tentativas, redirecionando para /login', lastError)
    return navigateTo('/login')
  } catch (error) {
    // Erro inesperado
    console.log('❌ Erro inesperado no middleware, redirecionando para /login', error)
    return navigateTo('/login')
  }
})

