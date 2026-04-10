<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

const { authenticatedFetch } = useAuthenticatedFetch()

const coupons = ref([])
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const deletingId = ref(null)

const form = ref({
  code: '',
  type: 'percentage',
  value: '',
  minOrder: '',
  maxUses: '',
  expiresAt: ''
})

const alert = ref({ show: false, message: '', type: 'success' })

const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

const formatPrice = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

const statusLabel = (c) => {
  if (!c.active) return { text: 'Inativo', cls: 'badge-inactive' }
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { text: 'Expirado', cls: 'badge-expired' }
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { text: 'Esgotado', cls: 'badge-expired' }
  return { text: 'Ativo', cls: 'badge-active' }
}

const loadCoupons = async () => {
  loading.value = true
  try {
    const data = await authenticatedFetch('/api/dashboard/coupons')
    coupons.value = Array.isArray(data) ? data : []
  } catch (e) {
    showAlert('Erro ao carregar cupons', 'error')
  } finally {
    loading.value = false
  }
}

const openModal = () => {
  form.value = { code: '', type: 'percentage', value: '', minOrder: '', maxUses: '', expiresAt: '' }
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

const createCoupon = async () => {
  if (!form.value.code.trim() || !form.value.value) {
    showAlert('Preencha código e valor', 'error')
    return
  }
  submitting.value = true
  try {
    const novo = await authenticatedFetch('/api/dashboard/coupons', {
      method: 'POST',
      body: {
        code: form.value.code.trim().toUpperCase(),
        type: form.value.type,
        value: form.value.value,
        minOrder: form.value.minOrder || 0,
        maxUses: form.value.maxUses || null,
        expiresAt: form.value.expiresAt || null
      }
    })
    coupons.value.unshift(novo)
    closeModal()
    showAlert('Cupom criado com sucesso!')
  } catch (e) {
    showAlert(e?.data?.message || 'Erro ao criar cupom', 'error')
  } finally {
    submitting.value = false
  }
}

const toggleActive = async (coupon) => {
  try {
    const updated = await authenticatedFetch(`/api/dashboard/coupons/${coupon._id}`, {
      method: 'PUT',
      body: { active: !coupon.active }
    })
    const idx = coupons.value.findIndex(c => c._id === coupon._id)
    if (idx !== -1) coupons.value[idx] = updated
  } catch (e) {
    showAlert('Erro ao atualizar cupom', 'error')
  }
}

const deleteCoupon = async (coupon) => {
  if (!confirm(`Remover cupom "${coupon.code}"?`)) return
  deletingId.value = coupon._id
  try {
    await authenticatedFetch(`/api/dashboard/coupons/${coupon._id}`, { method: 'DELETE' })
    coupons.value = coupons.value.filter(c => c._id !== coupon._id)
    showAlert('Cupom removido')
  } catch (e) {
    showAlert('Erro ao remover cupom', 'error')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadCoupons)
</script>

<template>
  <div class="coupons-page">
    <!-- Alert -->
    <transition name="slide-down">
      <div v-if="alert.show" :class="['page-alert', `alert-${alert.type}`]">
        {{ alert.message }}
      </div>
    </transition>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Cupons de Desconto</h1>
        <p class="page-description">Crie e gerencie cupons para seus clientes</p>
      </div>
      <button @click="openModal" class="btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Novo Cupom
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando cupons...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="coupons.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
      <p>Nenhum cupom cadastrado ainda.</p>
      <button @click="openModal" class="btn-primary">Criar primeiro cupom</button>
    </div>

    <!-- Lista de cupons -->
    <div v-else class="coupons-grid">
      <div v-for="coupon in coupons" :key="coupon._id" class="coupon-card">
        <div class="coupon-card-top">
          <div class="coupon-code">{{ coupon.code }}</div>
          <span :class="['badge', statusLabel(coupon).cls]">{{ statusLabel(coupon).text }}</span>
        </div>

        <div class="coupon-info">
          <div class="coupon-value">
            <span v-if="coupon.type === 'percentage'">{{ coupon.value }}% de desconto</span>
            <span v-else>{{ formatPrice(coupon.value) }} de desconto</span>
          </div>
          <div class="coupon-meta">
            <span v-if="coupon.minOrder > 0">Mín: {{ formatPrice(coupon.minOrder) }}</span>
            <span v-if="coupon.maxUses !== null">Usos: {{ coupon.usedCount }}/{{ coupon.maxUses }}</span>
            <span v-else>Usos: {{ coupon.usedCount }}/∞</span>
            <span v-if="coupon.expiresAt">Expira: {{ formatDate(coupon.expiresAt) }}</span>
          </div>
        </div>

        <div class="coupon-actions">
          <label class="toggle-switch" :title="coupon.active ? 'Desativar' : 'Ativar'">
            <input type="checkbox" :checked="coupon.active" @change="toggleActive(coupon)" />
            <span class="toggle-slider"></span>
          </label>
          <button @click="deleteCoupon(coupon)" class="btn-delete" :disabled="deletingId === coupon._id" title="Remover">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal novo cupom -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Novo Cupom</h2>
          <button @click="closeModal" class="btn-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Código do cupom *</label>
            <input v-model="form.code" type="text" placeholder="Ex: PROMO10" class="form-input" style="text-transform:uppercase" />
            <small>Será convertido para maiúsculas automaticamente</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Tipo de desconto *</label>
              <select v-model="form.type" class="form-input">
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Valor do desconto *</label>
              <div class="input-with-prefix">
                <span class="prefix">{{ form.type === 'percentage' ? '%' : 'R$' }}</span>
                <input v-model="form.value" type="number" min="0.01" :max="form.type === 'percentage' ? 100 : undefined" step="0.01" placeholder="0" class="form-input" />
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Pedido mínimo (R$)</label>
              <input v-model="form.minOrder" type="number" min="0" step="0.01" placeholder="0,00 (sem mínimo)" class="form-input" />
            </div>
            <div class="form-group">
              <label>Limite de usos</label>
              <input v-model="form.maxUses" type="number" min="1" step="1" placeholder="Ilimitado" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Data de expiração</label>
            <input v-model="form.expiresAt" type="date" class="form-input" />
            <small>Deixe em branco para não expirar</small>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancelar</button>
          <button @click="createCoupon" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Criando...' : 'Criar Cupom' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coupons-page {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  margin: 0;
}

.page-description {
  color: var(--color-text-secondary, #64748b);
  font-size: 0.9375rem;
  margin: 0.25rem 0 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary, #ff8e24);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
  white-space: nowrap;
}

.btn-primary:hover { filter: brightness(0.9); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: var(--color-bg, #f1f5f9);
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

/* Alert */
.page-alert {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.9375rem;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.alert-success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px); }

/* Loading / Empty */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-secondary, #64748b);
}

.spinner {
  width: 40px; height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #ff8e24);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Grid */
.coupons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.coupon-card {
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  transition: box-shadow 0.2s, transform 0.2s;
}

.coupon-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.coupon-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.coupon-code {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--color-text, #1e293b);
  font-family: monospace;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-active { background: #dcfce7; color: #166534; }
.badge-inactive { background: #f1f5f9; color: #64748b; }
.badge-expired { background: #fee2e2; color: #991b1b; }

.coupon-value {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-primary, #ff8e24);
}

.coupon-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #64748b);
}

.coupon-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.btn-delete {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1.5px solid #fca5a5;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-delete:hover { background: #fecaca; }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }

/* Toggle */
.toggle-switch {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 24px;
  cursor: pointer;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  inset: 0;
  background: #cbd5e1;
  border-radius: 99px;
  transition: background 0.2s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.toggle-switch input:checked + .toggle-slider { background: var(--color-primary, #ff8e24); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--color-surface, #fff);
  border-radius: 1rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.modal-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }

.btn-close {
  background: none; border: none; font-size: 1.25rem;
  cursor: pointer; color: var(--color-text-secondary, #64748b);
  line-height: 1; padding: 0.25rem;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.form-group { display: flex; flex-direction: column; gap: 0.375rem; flex: 1; }
.form-group label { font-size: 0.875rem; font-weight: 600; color: var(--color-text, #1e293b); }
.form-group small { font-size: 0.8125rem; color: var(--color-text-secondary, #64748b); }

.form-row { display: flex; gap: 1rem; }

.form-input {
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  background: var(--color-bg, #f8fafc);
  color: var(--color-text, #1e293b);
  width: 100%;
  transition: border-color 0.2s;
}
.form-input:focus { outline: none; border-color: var(--color-primary, #ff8e24); }

.input-with-prefix {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--color-bg, #f8fafc);
  transition: border-color 0.2s;
}
.input-with-prefix:focus-within { border-color: var(--color-primary, #ff8e24); }
.prefix {
  padding: 0 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #64748b);
  background: var(--color-border, #e2e8f0);
  align-self: stretch;
  display: flex;
  align-items: center;
  font-size: 0.9375rem;
}
.input-with-prefix .form-input {
  border: none;
  background: transparent;
  border-radius: 0;
}
.input-with-prefix .form-input:focus { outline: none; }

@media (max-width: 640px) {
  .form-row { flex-direction: column; }
  .coupons-grid { grid-template-columns: 1fr; }
}
</style>
