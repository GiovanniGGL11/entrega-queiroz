import { ref } from 'vue'

export function useAlert() {
  const alert = ref({
    show: false,
    type: 'info',
    title: '',
    message: ''
  })

  const showAlert = (message, type = 'info', title = '') => {
    alert.value = {
      show: true,
      type,
      title,
      message
    }
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
      hideAlert()
    }, 5000)
  }

  const hideAlert = () => {
    alert.value.show = false
  }

  const showSuccess = (message, title = 'Sucesso') => {
    showAlert(message, 'success', title)
  }

  const showError = (message, title = 'Erro') => {
    showAlert(message, 'error', title)
  }

  const showWarning = (message, title = 'Atenção') => {
    showAlert(message, 'warning', title)
  }

  const showInfo = (message, title = 'Informação') => {
    showAlert(message, 'info', title)
  }

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}











