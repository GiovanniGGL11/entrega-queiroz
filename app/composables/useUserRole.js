// composable para controle de papel do usuário logado
import { ref } from 'vue'

const userRole = ref(null)
const userName = ref('')
const userEmail = ref('')

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
    } catch {
      userRole.value = null
    }
  }

  const isOwner = () => userRole.value === 'owner' || userRole.value === null
  const isEmployee = () => userRole.value === 'employee'

  return {
    userRole,
    userName,
    userEmail,
    loadUserRole,
    isOwner,
    isEmployee
  }
}
