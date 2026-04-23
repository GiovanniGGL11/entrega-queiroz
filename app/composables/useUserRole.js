// composable para controle de papel do usuário logado
import { ref } from 'vue'

const userRole = ref(null)
const userName = ref('')
const userEmail = ref('')
const userPermissions = ref(['orders', 'pdv', 'motoboys', 'inventory'])

export const useUserRole = () => {
  const loadUserRole = () => {
    if (!process.client) return
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) { userRole.value = null; return }
      // Decodificar o payload JWT sem verificar assinatura (client-side)
      const payload = JSON.parse(atob(token.split('.')[1]))
      userRole.value = payload.role || 'owner'
      userName.value = payload.name || payload.email || ''
      userEmail.value = payload.email || ''

      // Para funcionários, carregar permissões da API
      if (payload.role === 'employee') {
        loadPermissionsFromAPI(token)
      } else {
        // Dono tem acesso a tudo
        userPermissions.value = ['orders', 'pdv', 'motoboys', 'inventory']
      }
    } catch {
      userRole.value = null
    }
  }

  const loadPermissionsFromAPI = async (token) => {
    try {
      const data = await $fetch('/api/dashboard/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data?.permissions) {
        userPermissions.value = data.permissions
      }
    } catch {
      // fallback: nenhuma permissão se a API falhar
      userPermissions.value = []
    }
  }

  const hasPermission = (key) => {
    if (userRole.value !== 'employee') return true
    return userPermissions.value.includes(key)
  }

  const isOwner = () => userRole.value === 'owner' || userRole.value === null
  const isEmployee = () => userRole.value === 'employee'

  return {
    userRole,
    userName,
    userEmail,
    userPermissions,
    loadUserRole,
    hasPermission,
    isOwner,
    isEmployee
  }
}
