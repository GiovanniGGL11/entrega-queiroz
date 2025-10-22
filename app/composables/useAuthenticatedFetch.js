// Composable para requisições autenticadas
export const useAuthenticatedFetch = () => {
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
    const headers = {
      ...getAuthHeaders(),
      ...options.headers
    }
    
    return await $fetch(url, {
      ...options,
      headers
    })
  }

  return {
    getAuthHeaders,
    authenticatedFetch
  }
}
