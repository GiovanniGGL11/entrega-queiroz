// Composable para gerenciar overlay de imagem
import { ref } from 'vue'

const showImageOverlay = ref(false)
const currentImageUrl = ref('')

export const useImageOverlay = () => {
  const openImageOverlay = (url) => {
    if (!url) return
    currentImageUrl.value = url
    showImageOverlay.value = true
    document.body.style.overflow = 'hidden'
  }

  const closeImageOverlay = () => {
    showImageOverlay.value = false
    currentImageUrl.value = ''
    // Pequeno delay antes de restaurar o scroll
    setTimeout(() => {
      if (!showImageOverlay.value) {
        document.body.style.overflow = ''
      }
    }, 300)
  }

  return {
    showImageOverlay,
    currentImageUrl,
    openImageOverlay,
    closeImageOverlay
  }
}




