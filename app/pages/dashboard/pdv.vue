<template>
  <div class="pdv-container">
    <!-- Header -->
    <div class="pdv-header">
      <h1>PDV — Balcão</h1>
      <p class="pdv-subtitle">Registre pedidos presenciais rapidamente</p>
    </div>

    <div class="pdv-layout">
      <!-- Painel de produtos -->
      <div class="pdv-products-panel">
        <!-- Filtro de categorias -->
        <div class="category-tabs">
          <button
            class="category-tab"
            :class="{ active: selectedCategory === null }"
            @click="selectedCategory = null"
          >Todos</button>
          <button
            v-for="cat in categories"
            :key="cat._id"
            class="category-tab"
            :class="{ active: selectedCategory === cat._id }"
            @click="selectedCategory = cat._id"
          >{{ cat.name }}</button>
        </div>

        <!-- Loading -->
        <div v-if="loadingProducts" class="pdv-loading">
          <div class="spinner"></div>
          <span>Carregando produtos...</span>
        </div>

        <!-- Grid de produtos -->
        <div v-else class="products-grid">
          <button
            v-for="product in filteredProducts"
            :key="product._id"
            class="product-card"
            :disabled="product.available === false"
            @click="addToCart(product)"
          >
            <div class="product-img-wrapper">
              <img
                v-if="product.image"
                :src="product.image"
                :alt="product.name"
                class="product-img"
              />
              <div v-else class="product-img-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
            </div>
            <div class="product-info">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-price">R$ {{ formatPrice(product.price) }}</span>
            </div>
            <div v-if="product.available === false" class="product-unavailable">Indisponível</div>
          </button>

          <div v-if="filteredProducts.length === 0" class="empty-products">
            Nenhum produto encontrado
          </div>
        </div>
      </div>

      <!-- Painel do carrinho / pedido -->
      <div class="pdv-cart-panel">
        <div class="cart-header">
          <h2>Pedido</h2>
          <button v-if="cart.length > 0" class="btn-clear-cart" @click="clearCart">Limpar</button>
        </div>

        <!-- Nome do cliente (opcional) -->
        <div class="cart-section">
          <label class="field-label">Nome do cliente (opcional)</label>
          <input
            v-model="customerName"
            type="text"
            class="field-input"
            placeholder="Ex: João"
            maxlength="100"
          />
        </div>

        <!-- Itens do carrinho -->
        <div class="cart-items">
          <div v-if="cart.length === 0" class="cart-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <p>Nenhum item adicionado</p>
          </div>

          <div v-for="(item, index) in cart" :key="index" class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-name">{{ item.name }}</span>
              <span class="cart-item-price">R$ {{ formatPrice(item.price) }} un.</span>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" @click="decreaseQty(index)">−</button>
              <span class="qty-value">{{ item.quantity }}</span>
              <button class="qty-btn" @click="increaseQty(index)">+</button>
              <button class="btn-remove" @click="removeItem(index)" title="Remover">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
            <div class="cart-item-subtotal">R$ {{ formatPrice(item.price * item.quantity) }}</div>
          </div>
        </div>

        <!-- Observações -->
        <div class="cart-section" v-if="cart.length > 0">
          <label class="field-label">Observações</label>
          <textarea
            v-model="notes"
            class="field-input field-textarea"
            placeholder="Ex: sem cebola, bem passado..."
            rows="2"
            maxlength="500"
          ></textarea>
        </div>

        <!-- Forma de pagamento -->
        <div class="cart-section" v-if="cart.length > 0">
          <label class="field-label">Forma de pagamento</label>
          <div class="payment-options">
            <button
              v-for="opt in paymentOptions"
              :key="opt.value"
              class="payment-btn"
              :class="{ active: paymentMethod === opt.value }"
              @click="paymentMethod = opt.value"
            >
              <span class="payment-icon" v-html="opt.icon"></span>
              {{ opt.label }}
            </button>
          </div>

          <!-- Campo de troco (apenas dinheiro) -->
          <div v-if="paymentMethod === 'dinheiro'" class="change-section">
            <label class="field-label">Pagou com quanto? (para calcular troco)</label>
            <input
              v-model="changeFor"
              type="number"
              class="field-input"
              placeholder="Ex: 50.00"
              min="0"
              step="0.01"
            />
            <div v-if="changeFor && parseFloat(changeFor) >= cartTotal" class="change-display">
              Troco: <strong>R$ {{ formatPrice(parseFloat(changeFor) - cartTotal) }}</strong>
            </div>
            <div v-else-if="changeFor && parseFloat(changeFor) < cartTotal" class="change-insufficient">
              Valor insuficiente para cobrir R$ {{ formatPrice(cartTotal) }}
            </div>
          </div>
        </div>

        <!-- Total e botão finalizar -->
        <div class="cart-footer" v-if="cart.length > 0">
          <div class="cart-total">
            <span>Total</span>
            <strong>R$ {{ formatPrice(cartTotal) }}</strong>
          </div>

          <button
            class="btn-finish"
            :disabled="submitting || !canFinish"
            @click="finishOrder"
          >
            <svg v-if="!submitting" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div v-else class="spinner-sm"></div>
            {{ submitting ? 'Finalizando...' : 'Finalizar Pedido' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de sucesso -->
    <div v-if="successModal" class="modal-overlay" @click.self="successModal = false">
      <div class="modal-success">
        <div class="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2>Pedido Registrado!</h2>
        <p class="success-order-num">{{ lastOrderNumber }}</p>
        <div class="success-details">
          <div class="success-row">
            <span>Total</span>
            <strong>R$ {{ formatPrice(lastTotal) }}</strong>
          </div>
          <div v-if="lastChange !== null && lastChange > 0" class="success-row success-change">
            <span>Troco</span>
            <strong>R$ {{ formatPrice(lastChange) }}</strong>
          </div>
          <div class="success-row">
            <span>Pagamento</span>
            <strong>{{ paymentLabel(lastPayment) }}</strong>
          </div>
        </div>
        <button class="btn-new-order" @click="startNewOrder">Novo Pedido</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface Product {
  _id: string
  name: string
  price: number
  image?: string
  category?: string
  available?: boolean
  complements?: any[]
}

interface Category {
  _id: string
  name: string
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

// Estado
const loadingProducts = ref(true)
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const selectedCategory = ref<string | null>(null)
const cart = ref<CartItem[]>([])
const customerName = ref('')
const notes = ref('')
const paymentMethod = ref('dinheiro')
const changeFor = ref<string>('')
const submitting = ref(false)
const successModal = ref(false)
const lastOrderNumber = ref('')
const lastTotal = ref(0)
const lastChange = ref<number | null>(null)
const lastPayment = ref('')

const paymentOptions = [
  { value: 'dinheiro', label: 'Dinheiro', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
  { value: 'pix', label: 'PIX', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  { value: 'cartao_debito', label: 'Débito', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
  { value: 'cartao_credito', label: 'Crédito', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
]

// Computed
const filteredProducts = computed(() => {
  if (!selectedCategory.value) return products.value
  return products.value.filter(p => p.category === selectedCategory.value)
})

const cartTotal = computed(() => {
  return parseFloat(cart.value.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2))
})

const canFinish = computed(() => {
  if (cart.value.length === 0) return false
  if (paymentMethod.value === 'dinheiro' && changeFor.value) {
    return parseFloat(changeFor.value) >= cartTotal.value
  }
  return true
})

// Funções
function formatPrice(val: number | string) {
  return parseFloat(String(val)).toFixed(2).replace('.', ',')
}

function paymentLabel(val: string) {
  return paymentOptions.find(o => o.value === val)?.label || val
}

function addToCart(product: Product) {
  const existing = cart.value.find(i => i.productId === product._id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      productId: product._id,
      name: product.name,
      price: parseFloat(String(product.price)),
      quantity: 1,
    })
  }
}

function increaseQty(index: number) {
  cart.value[index].quantity++
}

function decreaseQty(index: number) {
  if (cart.value[index].quantity > 1) {
    cart.value[index].quantity--
  } else {
    cart.value.splice(index, 1)
  }
}

function removeItem(index: number) {
  cart.value.splice(index, 1)
}

function clearCart() {
  cart.value = []
  customerName.value = ''
  notes.value = ''
  changeFor.value = ''
}

function startNewOrder() {
  successModal.value = false
  clearCart()
}

async function finishOrder() {
  if (!canFinish.value || submitting.value) return
  submitting.value = true

  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''

  try {
    const body: any = {
      items: cart.value.map(i => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
      paymentMethod: paymentMethod.value,
      customerName: customerName.value || undefined,
      notes: notes.value || undefined,
    }

    if (paymentMethod.value === 'dinheiro' && changeFor.value) {
      body.changeFor = parseFloat(changeFor.value)
    }

    const res = await $fetch('/api/dashboard/pdv-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    }) as any

    lastOrderNumber.value = res.orderNumber
    lastTotal.value = res.total
    lastChange.value = res.changeAmount
    lastPayment.value = paymentMethod.value
    successModal.value = true
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Erro ao finalizar pedido')
  } finally {
    submitting.value = false
  }
}

// Carregar dados
async function loadData() {
  loadingProducts.value = true
  try {
    const [prods, cats] = await Promise.all([
      $fetch('/api/products') as Promise<any[]>,
      $fetch('/api/categories') as Promise<any[]>,
    ])
    products.value = prods || []
    categories.value = cats || []
  } catch (err) {
    console.error('Erro ao carregar produtos:', err)
  } finally {
    loadingProducts.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.pdv-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.pdv-header {
  margin-bottom: 24px;
}

.pdv-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary, #111);
  margin: 0 0 4px;
}

.pdv-subtitle {
  color: var(--color-text-secondary, #666);
  margin: 0;
  font-size: 0.95rem;
}

/* Layout */
.pdv-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

@media (max-width: 900px) {
  .pdv-layout {
    grid-template-columns: 1fr;
  }
}

/* Painel de produtos */
.pdv-products-panel {
  background: var(--color-surface, #fff);
  border-radius: 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  padding: 20px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.category-tab {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: transparent;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--color-text-secondary, #666);
  transition: all 0.2s;
  white-space: nowrap;
}

.category-tab.active {
  background: var(--color-primary, #e53e3e);
  border-color: var(--color-primary, #e53e3e);
  color: #fff;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.product-card {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  background: var(--color-surface, #fff);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  overflow: hidden;
  text-align: left;
  position: relative;
  display: flex;
  flex-direction: column;
}

.product-card:hover:not(:disabled) {
  border-color: var(--color-primary, #e53e3e);
  box-shadow: 0 2px 12px rgba(229, 62, 62, 0.15);
  transform: translateY(-1px);
}

.product-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-img-wrapper {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-img-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-bg, #f9fafb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary, #999);
}

.product-info {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary, #111);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary, #e53e3e);
}

.product-unavailable {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 10px;
}

.empty-products {
  grid-column: 1/-1;
  text-align: center;
  color: var(--color-text-secondary, #999);
  padding: 40px 0;
}

/* Painel do carrinho */
.pdv-cart-panel {
  background: var(--color-surface, #fff);
  border-radius: 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  padding: 20px;
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.btn-clear-cart {
  background: none;
  border: none;
  color: var(--color-danger, #e53e3e);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px 8px;
}

.cart-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--color-bg, #f9fafb);
  color: var(--color-text-primary, #111);
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary, #e53e3e);
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

/* Itens do carrinho */
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--color-text-secondary, #999);
}

.cart-empty p {
  margin: 0;
  font-size: 0.9rem;
}

.cart-item {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  padding: 10px 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 4px;
}

.cart-item-info {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cart-item-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary, #111);
}

.cart-item-price {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #999);
}

.cart-item-controls {
  grid-column: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--color-border, #e5e7eb);
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary, #333);
  padding: 0;
  line-height: 1;
}

.qty-btn:hover {
  background: var(--color-primary, #e53e3e);
  border-color: var(--color-primary, #e53e3e);
  color: #fff;
}

.qty-value {
  font-weight: 700;
  font-size: 0.9rem;
  min-width: 20px;
  text-align: center;
}

.btn-remove {
  background: none;
  border: none;
  color: var(--color-text-secondary, #999);
  cursor: pointer;
  padding: 2px;
  margin-left: 4px;
  display: flex;
  align-items: center;
}

.btn-remove:hover {
  color: var(--color-danger, #e53e3e);
}

.cart-item-subtotal {
  grid-column: 2;
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-primary, #e53e3e);
}

/* Pagamento */
.payment-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.payment-btn {
  padding: 10px 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary, #666);
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  transition: all 0.15s;
}

.payment-btn.active {
  border-color: var(--color-primary, #e53e3e);
  background: rgba(229, 62, 62, 0.08);
  color: var(--color-primary, #e53e3e);
}

/* Troco */
.change-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.change-display {
  font-size: 0.9rem;
  color: #16a34a;
  font-weight: 600;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
}

.change-insufficient {
  font-size: 0.85rem;
  color: var(--color-danger, #dc2626);
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
}

/* Footer do carrinho */
.cart-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
}

.cart-total strong {
  font-size: 1.25rem;
  color: var(--color-primary, #e53e3e);
}

.btn-finish {
  width: 100%;
  padding: 14px;
  background: var(--color-primary, #e53e3e);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s;
}

.btn-finish:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-finish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinners */
.pdv-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  justify-content: center;
  color: var(--color-text-secondary, #999);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary, #e53e3e);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal de sucesso */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-success {
  background: var(--color-surface, #fff);
  border-radius: 16px;
  padding: 32px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #f0fdf4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
}

.modal-success h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.success-order-num {
  font-size: 0.9rem;
  color: var(--color-text-secondary, #666);
  background: var(--color-bg, #f9fafb);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  margin: 0;
}

.success-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.success-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--color-bg, #f9fafb);
}

.success-change {
  background: #f0fdf4;
  color: #16a34a;
}

.btn-new-order {
  width: 100%;
  padding: 14px;
  background: var(--color-primary, #e53e3e);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-new-order:hover {
  opacity: 0.9;
}
</style>
