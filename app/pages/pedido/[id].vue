<template>
  <div class="tracking-page">
    <!-- Header -->
    <div class="tracking-header">
      <NuxtLink to="/" class="btn-back">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Voltar ao Menu
      </NuxtLink>
      <div class="store-brand">
        <img v-if="storeLogo" :src="storeLogo" class="store-logo" alt="Logo" />
        <span class="store-name">{{ storeName }}</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-wrap">
      <div class="spinner"></div>
      <p>Buscando seu pedido...</p>
    </div>

    <!-- Erro -->
    <div v-else-if="erro" class="erro-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <h2>Pedido não encontrado</h2>
      <p>Verifique o link ou volte ao menu.</p>
      <NuxtLink to="/" class="btn-primary">Voltar ao Menu</NuxtLink>
    </div>

    <!-- Pedido -->
    <div v-else-if="pedido" class="tracking-content">
      <!-- Status principal -->
      <div class="status-hero" :class="statusClass">
        <div class="status-icon-wrap">
          <svg v-if="pedido.status === 'delivered'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
          </svg>
          <svg v-else-if="pedido.status === 'cancelled'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg v-else-if="pedido.status === 'out_for_delivery'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13" rx="2"></rect>
            <path d="M16 8h4l3 3v5h-7V8z"></path>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="status-text">
          <p class="pedido-num">Pedido {{ pedido.orderNumber }}</p>
          <h2>{{ statusLabel }}</h2>
          <p v-if="pedido.motoboyNome && pedido.status === 'out_for_delivery'" class="motoboy-destaque">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path>
            </svg>
            {{ pedido.motoboyNome }} está levando seu pedido
          </p>
        </div>
        <div class="pulse-ring" v-if="pedido.status !== 'delivered' && pedido.status !== 'cancelled'"></div>
      </div>

      <!-- Timeline -->
      <div class="timeline-card">
        <h3>Andamento do Pedido</h3>
        <div class="timeline">
          <div
            v-for="(step, idx) in timeline"
            :key="step.status"
            class="timeline-step"
            :class="{
              done: step.done,
              current: step.current,
              cancelled: pedido.status === 'cancelled' && idx === 0
            }"
          >
            <div class="step-dot">
              <svg v-if="step.done" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="step-line" v-if="idx < timeline.length - 1"></div>
            <div class="step-info">
              <span class="step-label">{{ step.label }}</span>
              <span v-if="step.current && pedido.status !== 'delivered'" class="step-current-badge">Agora</span>
            </div>
          </div>
        </div>

        <!-- Cancelado -->
        <div v-if="pedido.status === 'cancelled'" class="cancelled-msg">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          Este pedido foi cancelado.
        </div>
      </div>

      <!-- Detalhes -->
      <div class="details-grid">
        <!-- Itens -->
        <div class="detail-card">
          <h3>Itens do Pedido</h3>
          <div class="items-list">
            <div v-for="item in pedido.items" :key="item.name" class="item-row">
              <span class="item-qty">{{ item.quantity }}x</span>
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <div v-if="item.complements && item.complements.length" class="item-comps">
                  <span v-for="c in item.complements" :key="c.name">+ {{ c.quantity }}x {{ c.name }}</span>
                </div>
              </div>
              <span class="item-price">{{ formatCurrency(item.price * item.quantity) }}</span>
            </div>
          </div>
          <div class="total-rows">
            <div class="total-row">
              <span>Subtotal</span>
              <span>{{ formatCurrency(pedido.subtotal) }}</span>
            </div>
            <div class="total-row">
              <span>Taxa de entrega</span>
              <span>{{ pedido.deliveryInfo.deliveryFee > 0 ? formatCurrency(pedido.deliveryInfo.deliveryFee) : 'Grátis' }}</span>
            </div>
            <div v-if="pedido.discount > 0" class="total-row coupon-row">
              <span>
                Desconto
                <span v-if="pedido.coupon" class="coupon-badge">{{ pedido.coupon.code }}</span>
              </span>
              <span class="discount-val">-{{ formatCurrency(pedido.discount) }}</span>
            </div>
            <div class="total-row total-final">
              <span>Total</span>
              <span>{{ formatCurrency(pedido.totalAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Info entrega -->
        <div class="detail-card">
          <h3>{{ isRetirada ? 'Retirada no Local' : 'Entrega' }}</h3>
          <div class="info-rows">
            <div class="info-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{{ enderecoFormatado }}</span>
            </div>
            <div class="info-row" v-if="pedido.deliveryInfo.estimatedTime">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Estimativa: {{ pedido.deliveryInfo.estimatedTime }}</span>
            </div>
            <div class="info-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <span>{{ pagamentoLabel }}</span>
            </div>
            <div class="info-row" v-if="pedido.motoboyNome">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path>
              </svg>
              <span>Motoboy: <strong>{{ pedido.motoboyNome }}</strong></span>
            </div>
            <div class="info-row" v-if="pedido.notes">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>Obs: {{ pedido.notes }}</span>
            </div>
          </div>

          <!-- Atualização automática -->
          <div class="auto-update" v-if="pedido.status !== 'delivered' && pedido.status !== 'cancelled'">
            <div class="update-dot" :class="{ pulsing: atualizando }"></div>
            <span>Atualizando automaticamente...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const id = route.params.id

const pedido = ref(null)
const loading = ref(true)
const erro = ref(false)
const atualizando = ref(false)
const storeName = ref('')
const storeLogo = ref('')

let pollingInterval = null

const isRetirada = computed(() => pedido.value?.type === 'retirada')

const statusMap = computed(() => {
  if (isRetirada.value) {
    return {
      pending: 'Aguardando confirmação',
      confirmed: 'Pedido confirmado',
      preparing: 'Em preparação',
      ready: 'Pronto! Pode vir retirar',
      delivered: 'Retirado!',
      cancelled: 'Cancelado'
    }
  }
  return {
    pending: 'Aguardando confirmação',
    confirmed: 'Pedido confirmado',
    preparing: 'Em preparação',
    ready: 'Pronto para entrega',
    out_for_delivery: 'Saiu para entrega!',
    delivered: 'Entregue!',
    cancelled: 'Cancelado'
  }
})

const statusOrder = computed(() => {
  if (isRetirada.value) {
    return ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
  }
  return ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
})

const statusLabel = computed(() => statusMap.value[pedido.value?.status] || pedido.value?.status)

const statusClass = computed(() => {
  const s = pedido.value?.status
  if (s === 'delivered') return 'hero-delivered'
  if (s === 'cancelled') return 'hero-cancelled'
  if (s === 'out_for_delivery') return 'hero-delivery'
  if (s === 'ready') return 'hero-ready'
  return 'hero-active'
})

const timeline = computed(() => {
  if (!pedido.value) return []
  const order = statusOrder.value
  const map = statusMap.value
  const currentIdx = order.indexOf(pedido.value.status)
  return order.map((s, idx) => ({
    status: s,
    label: map[s],
    done: idx <= currentIdx,
    current: idx === currentIdx
  }))
})

const enderecoFormatado = computed(() => {
  if (!pedido.value?.deliveryInfo) return ''
  const d = pedido.value.deliveryInfo
  const parts = [d.address, d.number, d.complement, d.neighborhood, d.city].filter(Boolean)
  return parts.join(', ')
})

const pagamentoLabel = computed(() => {
  const map = { pix: 'Pagamento via Pix', dinheiro: 'Pagamento em dinheiro', cartao: 'Pagamento no cartão' }
  return map[pedido.value?.paymentMethod] || pedido.value?.paymentMethod || ''
})

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

const buscarPedido = async (showLoading = false) => {
  if (showLoading) loading.value = true
  else atualizando.value = true
  try {
    const res = await fetch(`/api/public/orders/${id}`)
    if (!res.ok) { erro.value = true; return }
    const data = await res.json()
    pedido.value = data

    // Parar polling se pedido finalizado
    if (data.status === 'delivered' || data.status === 'cancelled') {
      clearInterval(pollingInterval)
    }
  } catch {
    erro.value = true
  } finally {
    loading.value = false
    atualizando.value = false
  }
}

const carregarLoja = async () => {
  try {
    const res = await fetch('/api/public/settings')
    const data = await res.json()
    storeName.value = data.storeName || 'Delivery'
    storeLogo.value = data.logo || ''
  } catch {}
}

onMounted(async () => {
  await Promise.all([buscarPedido(true), carregarLoja()])

  // Atualizar a cada 8 segundos
  if (pedido.value && pedido.value.status !== 'delivered' && pedido.value.status !== 'cancelled') {
    pollingInterval = setInterval(() => buscarPedido(false), 8000)
  }
})

onUnmounted(() => {
  clearInterval(pollingInterval)
})
</script>

<style scoped>
* { box-sizing: border-box; }

.tracking-page {
  min-height: 100vh;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Header */
.tracking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 10;
}
.btn-back {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #555;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}
.btn-back:hover { color: #222; }
.store-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.store-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}
.store-name {
  font-weight: 700;
  font-size: 1rem;
}

/* Loading / Erro */
.loading-wrap, .erro-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 5rem 2rem;
  color: #888;
  text-align: center;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.erro-wrap h2 { margin: 0; color: #222; }
.erro-wrap p { margin: 0; }

/* Content */
.tracking-content {
  max-width: 680px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Status Hero */
.status-hero {
  border-radius: 16px;
  padding: 2rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  overflow: hidden;
  color: white;
}
.hero-active { background: linear-gradient(135deg, #f97316, #fb923c); }
.hero-delivery { background: linear-gradient(135deg, #2563eb, #3b82f6); }
.hero-delivered { background: linear-gradient(135deg, #16a34a, #22c55e); }
.hero-cancelled { background: linear-gradient(135deg, #dc2626, #ef4444); }

.status-icon-wrap {
  width: 68px;
  height: 68px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.status-text { flex: 1; }
.pedido-num { margin: 0 0 0.2rem; font-size: 0.85rem; opacity: 0.85; }
.status-text h2 { margin: 0 0 0.3rem; font-size: 1.4rem; }
.motoboy-destaque {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  right: 1.5rem;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255,255,255,0.6);
  animation: pulse-anim 1.8s ease-out infinite;
}
@keyframes pulse-anim {
  0% { transform: translateY(-50%) scale(1); opacity: 0.8; }
  100% { transform: translateY(-50%) scale(2.5); opacity: 0; }
}

/* Cards */
.timeline-card, .detail-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.timeline-card h3, .detail-card h3 {
  margin: 0 0 1.25rem;
  font-size: 1rem;
  color: #111;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.timeline-step {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  position: relative;
  padding-bottom: 1.25rem;
}
.timeline-step:last-child { padding-bottom: 0; }

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  z-index: 1;
  transition: all 0.3s;
  color: white;
}
.timeline-step.done .step-dot {
  background: #16a34a;
  border-color: #16a34a;
}
.timeline-step.current .step-dot {
  background: #f97316;
  border-color: #f97316;
  box-shadow: 0 0 0 4px rgba(249,115,22,0.2);
}

.step-line {
  position: absolute;
  left: 13px;
  top: 30px;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
  z-index: 0;
}
.timeline-step.done .step-line { background: #16a34a; }

.step-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 4px;
}
.step-label {
  font-size: 0.9rem;
  color: #888;
}
.timeline-step.done .step-label, .timeline-step.current .step-label {
  color: #111;
  font-weight: 500;
}
.step-current-badge {
  font-size: 0.72rem;
  background: #fff3e8;
  color: #f97316;
  border: 1px solid #fed7aa;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-weight: 600;
}

.cancelled-msg {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  margin-top: 1rem;
}

/* Details grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
@media (min-width: 600px) {
  .details-grid { grid-template-columns: 1fr 1fr; }
}

/* Items */
.items-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
.item-qty {
  font-weight: 700;
  color: #f97316;
  font-size: 0.9rem;
  min-width: 24px;
}
.item-info { flex: 1; }
.item-name { font-size: 0.9rem; font-weight: 500; }
.item-comps {
  display: flex;
  flex-direction: column;
  margin-top: 0.2rem;
}
.item-comps span { font-size: 0.78rem; color: #888; }
.item-price { font-size: 0.875rem; font-weight: 600; color: #111; }

.total-rows {
  border-top: 1px solid #f3f4f6;
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #666;
}
.coupon-row { color: #16a34a; font-weight: 600; }
.coupon-badge {
  display: inline-block;
  margin-left: 0.4rem;
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.5rem;
  letter-spacing: 0.04em;
  vertical-align: middle;
}
.discount-val { color: #16a34a; }

.total-final {
  font-size: 1rem;
  font-weight: 700;
  color: #111;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
  margin-top: 0.25rem;
}

/* Info rows */
.info-rows { display: flex; flex-direction: column; gap: 0.75rem; }
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #555;
  line-height: 1.4;
}
.info-row svg { flex-shrink: 0; margin-top: 2px; color: #aaa; }

/* Auto update */
.auto-update {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.8rem;
  color: #aaa;
}
.update-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}
.update-dot.pulsing {
  background: #22c55e;
  animation: blink 1s infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.btn-primary {
  display: inline-flex;
  align-items: center;
  background: #f97316;
  color: white;
  text-decoration: none;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: background 0.2s;
}
.btn-primary:hover { background: #ea6c0a; }
</style>
