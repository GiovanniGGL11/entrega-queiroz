import { ref } from 'vue'

// Estado global da cor primária
const primaryColor = ref('#ff8e24')

// Função para calcular cor hover (escurecer 10%)
const calculateHoverColor = (color) => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Escurecer 10%
  const hoverR = Math.max(0, Math.floor(r * 0.9))
  const hoverG = Math.max(0, Math.floor(g * 0.9))
  const hoverB = Math.max(0, Math.floor(b * 0.9))
  
  return `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`
}

// Função para aplicar cor primária
const applyPrimaryColor = (color) => {
  if (!process.client) return
  
  const root = document.documentElement
  const hoverColor = calculateHoverColor(color)
  
  root.style.setProperty('--color-primary', color)
  root.style.setProperty('--color-primary-hover', hoverColor)
  
  primaryColor.value = color
}

// Função para carregar cor primária das configurações
const loadPrimaryColor = async () => {
  if (!process.client) return
  
  try {
    const response = await $fetch('/api/public/settings')
    if (response.primaryColor) {
      applyPrimaryColor(response.primaryColor)
    }
  } catch (error) {
    console.error('Erro ao carregar cor primária:', error)
    // Usar cor padrão em caso de erro
    applyPrimaryColor('#ff8e24')
  }
}

export const usePrimaryColor = () => {
  return {
    primaryColor,
    applyPrimaryColor,
    loadPrimaryColor,
    calculateHoverColor
  }
}

