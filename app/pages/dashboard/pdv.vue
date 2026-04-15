<template>
  <div class="pdv-wrap">

    <!-- Header compacto -->
    <div class="pdv-topbar">
      <div class="pdv-topbar-left">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span>PDV — Balcão</span>
      </div>
      <!-- Mobile: botão para abrir carrinho -->
      <button class="cart-toggle-btn" @click="mobileView = 'cart'" v-if="mobileView === 'products'">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span v-if="cart.length > 0" class="cart-badge">{{ totalItems }}</span>
        <span class="cart-toggle-label">Pedido{{ cart.length > 0 ? ` · R$ ${formatPrice(cartTotal)}` : '' }}</span>
      </button>
      <button class="cart-toggle-btn back-btn" @click="mobileView = 'products'" v-else-if="mobileView === 'cart'">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Produtos
      </button>
    </div>

    <div class="pdv-body">

      <!-- ===== PAINEL PRODUTOS ===== -->
      <div class="panel-products" :class="{ 'mobile-hidden': mobileView !== 'products' }">

        <!-- Atalhos de categoria -->
        <div class="cat-jumps" v-if="categoriesWithProducts.length > 1">
          <button
            v-for="cat in categoriesWithProducts"
            :key="cat._id"
            class="cat-jump-btn"
            @click="scrollToCategory(cat._id)"
          >{{ cat.name }}</button>
        </div>

        <!-- Loading -->
        <div v-if="loadingProducts" class="loading-state">
          <div class="spinner"></div>
          <span>Carregando cardápio...</span>
        </div>

        <!-- Seções por categoria -->
        <div v-else class="categories-sections">
          <div
            v-for="cat in categoriesWithProducts"
            :key="cat._id"
            :id="`cat-${cat._id}`"
            class="category-section"
          >
            <h3 class="category-title">{{ cat.name }}</h3>
            <div class="products-grid">
              <button
                v-for="product in cat.products"
                :key="product._id"
                class="product-card"
                :class="{ unavailable: product.available === false }"
                :disabled="product.available === false"
                @click="addToCart(product)"
              >
                <div class="product-img-wrap">
                  <img v-if="product.image" :src="product.image" :alt="product.name" class="product-img" />
                  <div v-else class="product-img-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <div v-if="product.available === false" class="unavailable-overlay">Indisponível</div>
                  <!-- Badge qtd no carrinho -->
                  <div v-if="cartQty(product._id) > 0" class="qty-badge">{{ cartQty(product._id) }}</div>
                </div>
                <div class="product-info">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-price">R$ {{ formatPrice(product.price) }}</span>
                </div>
              </button>
            </div>
          </div>

          <div v-if="categoriesWithProducts.length === 0" class="empty-state">
            Nenhum produto disponível no cardápio.
          </div>
        </div>
      </div>

      <!-- ===== PAINEL CARRINHO ===== -->
      <div class="panel-cart" :class="{ 'mobile-hidden': mobileView !== 'cart' }">

        <div class="cart-inner">
          <div class="cart-top">
            <h2 class="cart-title">Pedido</h2>
            <button v-if="cart.length > 0" class="btn-clear" @click="clearCart">Limpar tudo</button>
          </div>

          <!-- Nome do cliente -->
          <div class="field-group">
            <label class="field-label">Cliente <span class="optional">(opcional)</span></label>
            <input v-model="customerName" type="text" class="field-input" placeholder="Ex: João" maxlength="100" />
          </div>

          <!-- Itens -->
          <div class="cart-items-wrap">
            <div v-if="cart.length === 0" class="cart-empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p>Toque em um produto para adicionar</p>
            </div>

            <div v-for="(item, idx) in cart" :key="idx" class="cart-item">
              <div class="ci-left">
                <span class="ci-name">{{ item.name }}</span>
                <span class="ci-unit">R$ {{ formatPrice(item.price) }} un.</span>
              </div>
              <div class="ci-controls">
                <button class="ci-btn" @click="decreaseQty(idx)">−</button>
                <span class="ci-qty">{{ item.quantity }}</span>
                <button class="ci-btn" @click="increaseQty(idx)">+</button>
              </div>
              <span class="ci-total">R$ {{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>

          <!-- Campos extras (só com itens) -->
          <template v-if="cart.length > 0">
            <!-- Observações -->
            <div class="field-group">
              <label class="field-label">Observações <span class="optional">(opcional)</span></label>
              <textarea v-model="notes" class="field-input field-textarea" placeholder="Ex: sem cebola, bem passado..." rows="2" maxlength="500"></textarea>
            </div>

            <!-- Pagamento -->
            <div class="field-group">
              <label class="field-label">Pagamento</label>
              <div class="payment-grid">
                <button
                  v-for="opt in paymentOptions"
                  :key="opt.value"
                  class="payment-btn"
                  :class="{ active: paymentMethod === opt.value }"
                  @click="paymentMethod = opt.value"
                >
                  <span v-html="opt.icon"></span>
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Troco -->
            <div v-if="paymentMethod === 'dinheiro'" class="field-group">
              <label class="field-label">Pagou com quanto?</label>
              <input v-model="changeFor" type="number" class="field-input" placeholder="Ex: 50,00" min="0" step="0.01" />
              <div v-if="changeFor && parseFloat(changeFor) >= cartTotal" class="change-ok">
                Troco: <strong>R$ {{ formatPrice(parseFloat(changeFor) - cartTotal) }}</strong>
              </div>
              <div v-else-if="changeFor && parseFloat(changeFor) < cartTotal" class="change-err">
                Valor abaixo do total (R$ {{ formatPrice(cartTotal) }})
              </div>
            </div>

            <!-- Total + Finalizar -->
            <div class="cart-footer">
              <div class="cart-total-row">
                <span>Total</span>
                <strong>R$ {{ formatPrice(cartTotal) }}</strong>
              </div>
              <button class="btn-finish" :disabled="submitting || !canFinish" @click="finishOrder">
                <svg v-if="!submitting" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div v-else class="spinner-sm"></div>
                {{ submitting ? 'Finalizando...' : 'Finalizar Pedido' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Modal sucesso -->
    <div v-if="successModal" class="modal-overlay" @click.self="startNewOrder">
      <div class="modal-box">
        <div class="modal-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2>Pedido Registrado!</h2>
        <p class="modal-order-num">{{ lastOrderNumber }}</p>
        <div class="modal-rows">
          <div class="modal-row">
            <span>Total</span>
            <strong>R$ {{ formatPrice(lastTotal) }}</strong>
          </div>
          <div v-if="lastChange !== null && lastChange > 0" class="modal-row modal-row-green">
            <span>Troco</span>
            <strong>R$ {{ formatPrice(lastChange) }}</strong>
          </div>
          <div class="modal-row">
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
  categoryId?: string
  available?: boolean
  isVisible?: boolean
}

interface Category {
  _id: string
  name: string
  order?: number
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

// Estado
const loadingProducts = ref(true)
const allProducts = ref<Product[]>([])
const categories = ref<Category[]>([])
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
const mobileView = ref<'products' | 'cart'>('products')

const paymentOptions = [
  { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { value: 'pix', label: 'PIX', icon: '⚡' },
  { value: 'cartao_debito', label: 'Débito', icon: '💳' },
  { value: 'cartao_credito', label: 'Crédito', icon: '💳' },
]

// Produtos visíveis agrupados por categoria
const categoriesWithProducts = computed(() => {
  const visible = allProducts.value.filter(p => p.isVisible !== false)

  return categories.value
    .map(cat => ({
      ...cat,
      products: visible.filter(p => p.categoryId === cat._id),
    }))
    .filter(cat => cat.products.length > 0)
})

const totalItems = computed(() => cart.value.reduce((s, i) => s + i.quantity, 0))

const cartTotal = computed(() =>
  parseFloat(cart.value.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2))
)

const canFinish = computed(() => {
  if (cart.value.length === 0) return false
  if (paymentMethod.value === 'dinheiro' && changeFor.value) {
    return parseFloat(changeFor.value) >= cartTotal.value
  }
  return true
})

function cartQty(productId: string) {
  return cart.value.find(i => i.productId === productId)?.quantity ?? 0
}

function formatPrice(val: number | string) {
  return parseFloat(String(val)).toFixed(2).replace('.', ',')
}

function paymentLabel(val: string) {
  return paymentOptions.find(o => o.value === val)?.label || val
}

function scrollToCategory(id: string) {
  const el = document.getElementById(`cat-${id}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

function increaseQty(idx: number) { cart.value[idx].quantity++ }

function decreaseQty(idx: number) {
  if (cart.value[idx].quantity > 1) cart.value[idx].quantity--
  else cart.value.splice(idx, 1)
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
  mobileView.value = 'products'
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

async function loadData() {
  loadingProducts.value = true
  try {
    const [prods, cats] = await Promise.all([
      $fetch('/api/products', { params: { showAll: 'false' } }) as Promise<any[]>,
      $fetch('/api/categories') as Promise<any[]>,
    ])
    allProducts.value = prods || []
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
* { box-sizing: border-box; }

.pdv-wrap {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg, #f3f4f6);
  overflow: hidden;
}

/* Topbar */
.pdv-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--color-surface, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  flex-shrink: 0;
}

.pdv-topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-primary, #111);
}

.cart-toggle-btn {
  display: none;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--color-primary, #e53e3e);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
}

.back-btn {
  background: var(--color-bg, #f3f4f6);
  color: var(--color-text-primary, #333);
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #16a34a;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Body */
.pdv-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 0;
  overflow: hidden;
}

/* Painel produtos */
.panel-products {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg, #f3f4f6);
}

/* Atalhos categoria */
.cat-jumps {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: var(--color-surface, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  overflow-x: auto;
  flex-shrink: 0;
  scrollbar-width: none;
}
.cat-jumps::-webkit-scrollbar { display: none; }

.cat-jump-btn {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface, #fff);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary, #555);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
}
.cat-jump-btn:hover {
  background: var(--color-primary, #e53e3e);
  border-color: var(--color-primary, #e53e3e);
  color: #fff;
}

/* Seções */
.categories-sections {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.category-section {}

.category-title {
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary, #888);
  margin: 0 0 12px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}

.product-card {
  border: 2px solid transparent;
  border-radius: 12px;
  background: var(--color-surface, #fff);
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  text-align: left;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.product-card:hover:not(:disabled) {
  border-color: var(--color-primary, #e53e3e);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.18);
}

.product-card.unavailable {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-img-wrap {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  position: relative;
  background: var(--color-bg, #f3f4f6);
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-img-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
}

.unavailable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--color-primary, #e53e3e);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.product-info {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.product-name {
  font-size: 0.82rem;
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

/* Painel carrinho */
.panel-cart {
  border-left: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface, #fff);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-inner {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.cart-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary, #111);
}

.btn-clear {
  background: none;
  border: none;
  font-size: 0.8rem;
  color: var(--color-danger, #dc2626);
  cursor: pointer;
  padding: 4px 6px;
}

/* Campos */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #888);
}

.optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: #aaa;
}

.field-input {
  padding: 9px 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--color-bg, #f9fafb);
  color: var(--color-text-primary, #111);
  width: 100%;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary, #e53e3e);
}

.field-textarea {
  resize: vertical;
  min-height: 64px;
  font-family: inherit;
}

/* Itens carrinho */
.cart-items-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 60px;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 0;
  color: var(--color-text-secondary, #bbb);
  text-align: center;
}

.cart-empty p {
  margin: 0;
  font-size: 0.875rem;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--color-bg, #f9fafb);
  border-radius: 10px;
  border: 1px solid var(--color-border, #e5e7eb);
}

.ci-left {
  flex: 1;
  min-width: 0;
}

.ci-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary, #111);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ci-unit {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #999);
}

.ci-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ci-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface, #fff);
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary, #333);
  padding: 0;
  line-height: 1;
  font-weight: 700;
  transition: all 0.1s;
}

.ci-btn:hover {
  background: var(--color-primary, #e53e3e);
  border-color: var(--color-primary, #e53e3e);
  color: #fff;
}

.ci-qty {
  font-weight: 700;
  font-size: 0.95rem;
  min-width: 20px;
  text-align: center;
}

.ci-total {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-primary, #e53e3e);
  flex-shrink: 0;
  min-width: 60px;
  text-align: right;
}

/* Pagamento */
.payment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.payment-btn {
  padding: 10px 6px;
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 0.82rem;
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
  background: rgba(229, 62, 62, 0.07);
  color: var(--color-primary, #e53e3e);
}

/* Troco */
.change-ok {
  font-size: 0.875rem;
  color: #16a34a;
  font-weight: 600;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.change-err {
  font-size: 0.85rem;
  color: #dc2626;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

/* Footer carrinho */
.cart-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border, #e5e7eb);
  margin-top: 4px;
}

.cart-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.05rem;
}

.cart-total-row strong {
  font-size: 1.4rem;
  color: var(--color-primary, #e53e3e);
}

.btn-finish {
  width: 100%;
  padding: 15px;
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

.btn-finish:hover:not(:disabled) { opacity: 0.9; }
.btn-finish:disabled { opacity: 0.45; cursor: not-allowed; }

/* Spinners */
.loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  justify-content: center;
  color: var(--color-text-secondary, #999);
}

.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary, #e53e3e);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-secondary, #aaa);
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-box {
  background: var(--color-surface, #fff);
  border-radius: 20px;
  padding: 32px 28px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: pop-in 0.25s ease;
}

@keyframes pop-in {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-icon {
  width: 80px;
  height: 80px;
  background: #f0fdf4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
}

.modal-box h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.modal-order-num {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #666);
  background: var(--color-bg, #f3f4f6);
  padding: 6px 18px;
  border-radius: 20px;
  font-weight: 600;
  margin: 0;
}

.modal-rows {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--color-bg, #f3f4f6);
  border-radius: 10px;
  font-size: 0.9rem;
}

.modal-row-green {
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
  transition: opacity 0.15s;
}
.btn-new-order:hover { opacity: 0.9; }

/* ===== MOBILE ===== */
@media (max-width: 768px) {
  .pdv-wrap {
    height: 100dvh;
  }

  .cart-toggle-btn {
    display: flex;
  }

  .cart-toggle-label {
    font-size: 0.875rem;
  }

  .pdv-body {
    grid-template-columns: 1fr;
    overflow: hidden;
  }

  .panel-products,
  .panel-cart {
    grid-column: 1;
    grid-row: 1;
    height: 100%;
    overflow: hidden;
  }

  .mobile-hidden {
    display: none;
  }

  .panel-cart {
    border-left: none;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }

  .categories-sections {
    padding: 12px 14px 80px;
  }

  .cat-jumps {
    padding: 10px 14px;
  }
}
</style>
