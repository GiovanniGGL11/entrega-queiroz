import { ref, computed } from 'vue'

// Estado global do carrinho
const cart = ref([])

// Chave para localStorage
const CART_KEY = "queiroz-hamburgueria-cart"

// Carregar carrinho do localStorage
const loadCart = () => {
  if (process.client) {
    const saved = localStorage.getItem(CART_KEY)
    if (saved) {
      try {
        cart.value = JSON.parse(saved)
      } catch (e) {
        console.error("Invalid cart data from localStorage")
        cart.value = []
      }
    }
  }
}

// Salvar carrinho no localStorage
const saveCart = () => {
  if (process.client) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart.value))
  }
}

// Adicionar item ao carrinho
const addToCart = (item, quantity = 1, complements = [], observation = '') => {
  const complementsStr = complements
    .map(c => `${c.name}:${c.quantity}`)
    .sort()
    .join(',')
  
  const variantKey = `${item._id}|${observation}|${complementsStr}`
  
  // Calcular preço total do item
  let totalPrice = item.price * quantity
  
  // Adicionar preço dos complementos
  complements.forEach(comp => {
    if (comp.quantity > 0) {
      totalPrice += comp.price * comp.quantity * quantity
    }
  })
  
  const cartItem = {
    id: `${item._id}_${Date.now()}`,
    productId: item._id,
    variantKey,
    name: item.name,
    price: item.price,
    image: item.image,
    description: item.description,
    quantity,
    complements,
    observation,
    totalPrice
  }
  
  // Verificar se já existe item similar
  const existingIndex = cart.value.findIndex(
    existingItem => existingItem.variantKey === variantKey
  )
  
  if (existingIndex >= 0) {
    // Atualizar quantidade existente
    cart.value[existingIndex].quantity += quantity
    cart.value[existingIndex].totalPrice += totalPrice
  } else {
    // Adicionar novo item
    cart.value.push(cartItem)
  }
  
  saveCart()
}

// Remover item do carrinho
const removeFromCart = (variantKey) => {
  const index = cart.value.findIndex(item => item.variantKey === variantKey)
  if (index !== -1) {
    cart.value.splice(index, 1)
    saveCart()
  }
}

// Atualizar quantidade de um item
const updateCartQuantity = (variantKey, delta) => {
  const index = cart.value.findIndex(item => item.variantKey === variantKey)
  if (index === -1) return
  
  const item = cart.value[index]
  const oldQuantity = item.quantity
  const newQuantity = Math.max(1, oldQuantity + delta)
  
  if (newQuantity === oldQuantity) return
  
  const unitPrice = item.totalPrice / oldQuantity
  item.quantity = newQuantity
  item.totalPrice = unitPrice * newQuantity
  
  saveCart()
}

// Limpar carrinho
const clearCart = () => {
  cart.value = []
  saveCart()
}

// Computeds
const cartCount = computed(() => {
  return cart.value.reduce((total, item) => total + item.quantity, 0)
})

const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.totalPrice, 0)
})

const cartTotal = computed(() => {
  return cartSubtotal.value
})

// Composable principal
export const useCart = () => {
  return {
    // Estado
    cart: readonly(cart),
    
    // Computeds
    cartCount,
    cartSubtotal,
    cartTotal,
    
    // Métodos
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    loadCart,
    saveCart
  }
}

// Carregar carrinho automaticamente quando o composable é usado
if (process.client) {
  loadCart()
}
