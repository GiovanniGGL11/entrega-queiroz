// Composable para requisições autenticadas
import { useApiCache } from './useApiCache'

export const useAuthenticatedFetch = () => {
  const { getCacheKey, get, set, clear } = useApiCache()

  const getAuthHeaders = () => {
    const headers = {}
    if (process.client) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  const authenticatedFetch = async (url, options = {}) => {
    // Verificar cache apenas para GET requests
    if (!options.method || options.method === 'GET') {
      const cacheKey = getCacheKey(url, options.query || {})
      const cachedData = get(cacheKey)
      
      if (cachedData) {
        return cachedData
      }
    }

    const headers = {
      ...getAuthHeaders(),
      ...options.headers
    }
    
    const response = await $fetch(url, {
      ...options,
      headers
    })

    // Cachear resposta apenas para GET requests
    if (!options.method || options.method === 'GET') {
      const cacheKey = getCacheKey(url, options.query || {})
      set(cacheKey, response)
    }

    return response
  }

  const clearCache = (pattern) => {
    clear(pattern)
  }

  return {
    getAuthHeaders,
    authenticatedFetch,
    clearCache
  }
}
