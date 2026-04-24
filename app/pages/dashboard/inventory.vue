<template>
  <div class="inventory-page">
    <div class="page-header">
      <div class="header-left">
        <h1>Estoque</h1>
        <p class="page-desc">Controle de produtos e ingredientes</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo Item
      </button>
    </div>

    <!-- Cards de resumo -->
    <div class="summary-row">
      <div class="sum-card">
        <span class="sum-num">{{ items.length }}</span>
        <span class="sum-label">Itens controlados</span>
      </div>
      <div class="sum-card sum-warn">
        <span class="sum-num">{{ lowStockCount }}</span>
        <span class="sum-label">Estoque baixo</span>
      </div>
      <div class="sum-card sum-danger">
        <span class="sum-num">{{ zeroStockCount }}</span>
        <span class="sum-label">Sem estoque</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div><p>Carregando...</p>
    </div>

    <template v-else>
      <!-- Abas de categoria -->
      <div class="tabs-bar">
        <button
          v-for="tab in tabs" :key="tab"
          :class="['tab-btn', activeTab === tab && 'tab-active']"
          @click="activeTab = tab"
        >
          {{ tab }}
          <span class="tab-count">{{ tabCount(tab) }}</span>
        </button>
      </div>

      <!-- Lista de itens -->
      <div v-if="filteredItems.length === 0" class="empty-cat">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h18l-2 14H5L3 3z"/><path d="M8 21h8"/></svg>
        <p>Nenhum item nesta categoria</p>
        <button @click="openCreateModal" class="btn-primary" style="margin-top:.5rem">Adicionar item</button>
      </div>

      <div v-else class="items-list">
        <div v-for="item in filteredItems" :key="item._id" :class="['item-card', stockStatus(item)]">
          <div class="item-main">
            <div class="item-header-row">
              <div class="item-name-wrap">
                <span class="item-name">{{ item.name }}</span>
                <span :class="['item-type-badge', item.type === 'produto' ? 'badge-produto' : 'badge-ingr']">
                  {{ item.type === 'produto' ? 'Produto' : 'Ingrediente' }}
                </span>
              </div>
              <div :class="['stock-badge', stockStatus(item)]">
                <span class="stock-num">{{ item.currentStock }}</span>
                <span class="stock-unit">{{ item.unit }}</span>
              </div>
            </div>

            <div class="item-meta">
              <span
                v-if="editingMinStockId !== item._id"
                class="meta-item meta-min-editable"
                title="Clique para editar o mínimo"
                @click="startEditMinStock(item)"
              >Mín: {{ item.minStock }} {{ item.unit }} <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span>
              <span v-else class="meta-item meta-min-input-wrap">
                <span style="font-size:.8rem;color:#64748b">Mín:</span>
                <input
                  v-model.number="editingMinStockValue"
                  type="number" min="0"
                  class="min-stock-input"
                  @keydown.enter="saveMinStock(item)"
                  @keydown.esc="editingMinStockId = null"
                  @blur="saveMinStock(item)"
                  ref="minStockInputRef"
                  autofocus
                />
                <span style="font-size:.8rem;color:#64748b">{{ item.unit }}</span>
              </span>
              <span v-if="item.costPrice > 0" class="meta-item">Custo: {{ formatCurrency(item.costPrice) }}</span>
              <span v-if="item.type === 'produto' && item.productId" class="meta-item meta-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Vinculado ao cardápio
              </span>
              <span v-if="stockStatus(item) === 'zero'" class="meta-item meta-danger">SEM ESTOQUE</span>
              <span v-else-if="stockStatus(item) === 'low'" class="meta-item meta-warn">ESTOQUE BAIXO</span>
            </div>
          </div>

          <div class="item-actions">
            <button @click="openAdjust(item, 'entrada')" class="btn-adj btn-entrada" title="Entrada">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Entrada
            </button>
            <button @click="openAdjust(item, 'saida')" class="btn-adj btn-saida" title="Saída">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Saída
            </button>
            <button @click="openEdit(item)" class="btn-adj btn-edit" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button @click="confirmRemove(item)" class="btn-adj btn-remove" title="Remover">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2,-2V6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal: Novo Item -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Novo Item de Estoque</h2>
          <button @click="showCreateModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <!-- Tipo -->
          <div class="type-selector">
            <button :class="['type-opt', createForm.type === 'produto' && 'type-opt-active']" @click="createForm.type = 'produto'">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
              <span>Produto</span>
              <small>Bebidas, itens prontos</small>
            </button>
            <button :class="['type-opt', createForm.type === 'ingrediente' && 'type-opt-active']" @click="createForm.type = 'ingrediente'">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>
              <span>Ingrediente</span>
              <small>Matérias-primas</small>
            </button>
          </div>

          <!-- Info: Produto -->
          <div v-if="createForm.type === 'produto'" class="info-box info-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            O estoque será debitado automaticamente quando um pedido com este produto for <strong>confirmado</strong>.
          </div>

          <!-- Vincular produto do cardápio (apenas tipo Produto) -->
          <div v-if="createForm.type === 'produto'" class="form-group form-full-block">
            <label>Produto do cardápio *</label>
            <div v-if="loadingProducts" class="products-loading">Carregando produtos...</div>
            <div v-else-if="availableProducts.length === 0" class="info-box info-warn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              Todos os produtos já estão no estoque ou não há produtos cadastrados.
            </div>
            <select v-else v-model="createForm.productId" @change="onProductSelect">
              <option value="">— Selecione um produto —</option>
              <option v-for="p in availableProducts" :key="p._id" :value="p._id">
                {{ p.name }}{{ p.category ? ' · ' + p.category.name : '' }}
              </option>
            </select>
          </div>

          <div class="form-grid">
            <div class="form-group form-full">
              <label>Nome do item *</label>
              <input v-model="createForm.name" type="text" :placeholder="createForm.type === 'produto' ? 'Preenchido automaticamente' : 'Ex: Farinha de trigo'" />
            </div>
            <div class="form-group">
              <label>Categoria *</label>
              <input v-model="createForm.category" type="text" placeholder="Ex: Bebidas" list="cat-list" />
              <datalist id="cat-list">
                <option v-for="c in existingCategories" :key="c" :value="c" />
              </datalist>
            </div>
            <div class="form-group">
              <label>Unidade *</label>
              <select v-model="createForm.unit">
                <option value="un">un — unidade</option>
                <option value="kg">kg — quilograma</option>
                <option value="g">g — grama</option>
                <option value="L">L — litro</option>
                <option value="ml">ml — mililitro</option>
                <option value="cx">cx — caixa</option>
                <option value="pct">pct — pacote</option>
                <option value="fd">fd — fardo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Estoque inicial</label>
              <input v-model.number="createForm.initialStock" type="number" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Estoque mínimo</label>
              <input v-model.number="createForm.minStock" type="number" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Custo unitário (R$)</label>
              <input v-model.number="createForm.costPrice" type="number" min="0" step="0.01" placeholder="0,00" />
            </div>
          </div>

          <p v-if="createError" class="form-error">{{ createError }}</p>

          <div class="modal-actions">
            <button @click="showCreateModal = false" class="btn-secondary" :disabled="creating">Cancelar</button>
            <button @click="createItem" class="btn-primary" :disabled="creating">
              {{ creating ? 'Salvando...' : 'Adicionar Item' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Ajuste (Entrada/Saída) -->
    <div v-if="showAdjustModal" class="modal-overlay">
      <div class="modal modal-sm">
        <!-- Cabeçalho colorido -->
        <div :class="['adjust-modal-header', adjustForm.type === 'entrada' ? 'adj-header-entrada' : 'adj-header-saida']">
          <div class="adj-header-icon">
            <svg v-if="adjustForm.type === 'entrada'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div>
            <h2>{{ adjustForm.type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída' }}</h2>
            <p>{{ adjustItem?.name }}</p>
          </div>
          <button @click="showAdjustModal = false" class="adj-close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Estoque atual -->
          <div class="adj-stock-row">
            <div class="adj-stock-box">
              <span class="adj-stock-label">Estoque atual</span>
              <span class="adj-stock-val">{{ adjustItem?.currentStock }} <small>{{ adjustItem?.unit }}</small></span>
            </div>
            <div class="adj-arrow">
              <svg v-if="adjustForm.type === 'entrada'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
            <div class="adj-stock-box adj-stock-new">
              <span class="adj-stock-label">Após ajuste</span>
              <span :class="['adj-stock-val', adjustForm.type === 'entrada' ? 'adj-val-entrada' : 'adj-val-saida']">
                {{ adjustForm.type === 'entrada'
                  ? (adjustItem?.currentStock || 0) + (adjustForm.quantity || 0)
                  : Math.max(0, (adjustItem?.currentStock || 0) - (adjustForm.quantity || 0)) }}
                <small>{{ adjustItem?.unit }}</small>
              </span>
            </div>
          </div>

          <!-- Quantidade -->
          <div class="form-group">
            <label>Quantidade *</label>
            <input
              v-model.number="adjustForm.quantity"
              type="number" min="1" placeholder="0"
              class="adj-qty-input"
              autofocus
            />
          </div>

          <!-- Motivo -->
          <div class="form-group">
            <label>Motivo <span style="color:#94a3b8;font-weight:400">(opcional)</span></label>
            <input
              v-model="adjustForm.reason"
              type="text"
              :placeholder="adjustForm.type === 'entrada' ? 'Ex: Compra do fornecedor' : 'Ex: Perda, vencimento'"
            />
          </div>

          <p v-if="adjustError" class="form-error">{{ adjustError }}</p>

          <div class="modal-actions">
            <button @click="showAdjustModal = false" class="btn-secondary" :disabled="adjusting">Cancelar</button>
            <button
              @click="saveAdjust"
              :class="['btn-primary', adjustForm.type === 'saida' && 'btn-danger']"
              :disabled="adjusting"
            >
              {{ adjusting ? 'Salvando...' : (adjustForm.type === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Item -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Editar Item</h2>
          <button @click="showEditModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group form-full">
              <label>Nome</label>
              <input v-model="editForm.name" type="text" />
            </div>
            <div class="form-group">
              <label>Categoria</label>
              <input v-model="editForm.category" type="text" list="cat-list-edit" />
              <datalist id="cat-list-edit">
                <option v-for="c in existingCategories" :key="c" :value="c" />
              </datalist>
            </div>
            <div class="form-group">
              <label>Unidade</label>
              <select v-model="editForm.unit">
                <option value="un">un</option><option value="kg">kg</option>
                <option value="g">g</option><option value="L">L</option>
                <option value="ml">ml</option><option value="cx">cx</option>
                <option value="pct">pct</option><option value="fd">fd</option>
              </select>
            </div>
            <div class="form-group">
              <label>Estoque atual</label>
              <input v-model.number="editForm.currentStock" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Estoque mínimo</label>
              <input v-model.number="editForm.minStock" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Custo unitário (R$)</label>
              <input v-model.number="editForm.costPrice" type="number" min="0" step="0.01" />
            </div>
          </div>
          <div class="modal-actions">
            <button @click="showEditModal = false" class="btn-secondary" :disabled="editing">Cancelar</button>
            <button @click="saveEdit" class="btn-primary" :disabled="editing">{{ editing ? 'Salvando...' : 'Salvar' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Confirmar remoção -->
    <div v-if="showRemoveModal" class="modal-overlay" @click.self="showRemoveModal = false">
      <div class="modal modal-sm">
        <div class="modal-body" style="text-align:center; padding: 2rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <h3 style="margin: .75rem 0 .25rem;">Remover item?</h3>
          <p style="color:#64748b; font-size:.9rem;">{{ removeTarget?.name }}</p>
          <div class="modal-actions" style="margin-top:1.5rem; justify-content:center;">
            <button @click="showRemoveModal = false" class="btn-secondary">Cancelar</button>
            <button @click="removeItem" class="btn-primary btn-danger" :disabled="removing">{{ removing ? 'Removendo...' : 'Remover' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" :class="['toast', toast.type]">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

definePageMeta({ layout: 'dashboard' })

const { authenticatedFetch } = useAuthenticatedFetch()

// Estado
const loading = ref(true)
const items = ref([])
const activeTab = ref('Todos')
const availableProducts = ref([])
const loadingProducts = ref(false)

// Modais
const showCreateModal = ref(false)
const showAdjustModal = ref(false)
const showEditModal = ref(false)
const showRemoveModal = ref(false)

const creating = ref(false)
const adjusting = ref(false)
const editing = ref(false)
const removing = ref(false)

const createError = ref('')
const adjustError = ref('')

const adjustItem = ref(null)
const editItem = ref(null)
const removeTarget = ref(null)

// Edição inline de estoque mínimo
const editingMinStockId = ref(null)
const editingMinStockValue = ref(0)

const toast = ref({ show: false, type: 'success', message: '' })

// Formulários
const createForm = ref({ type: 'produto', name: '', category: '', unit: 'un', productId: '', initialStock: 0, minStock: 0, costPrice: 0 })
const adjustForm = ref({ type: 'entrada', quantity: null, reason: '' })
const editForm = ref({ name: '', category: '', unit: 'un', currentStock: 0, minStock: 0, costPrice: 0 })

// Computados
const existingCategories = computed(() => [...new Set(items.value.map(i => i.category))].sort())

const tabs = computed(() => {
  const cats = existingCategories.value
  return ['Todos', ...cats]
})

const filteredItems = computed(() => {
  if (activeTab.value === 'Todos') return items.value
  return items.value.filter(i => i.category === activeTab.value)
})

const tabCount = (tab) => {
  if (tab === 'Todos') return items.value.length
  return items.value.filter(i => i.category === tab).length
}

const lowStockCount = computed(() => items.value.filter(i => i.currentStock > 0 && i.currentStock <= i.minStock).length)
const zeroStockCount = computed(() => items.value.filter(i => i.currentStock === 0).length)

const stockStatus = (item) => {
  if (item.currentStock === 0) return 'zero'
  if (item.minStock > 0 && item.currentStock <= item.minStock) return 'low'
  return 'ok'
}

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

// Ações
const showToast = (message, type = 'success') => {
  toast.value = { show: true, type, message }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await authenticatedFetch('/api/inventory', { noCache: true })
  } catch {
    showToast('Erro ao carregar estoque', 'error')
  } finally {
    loading.value = false
  }
}

const loadAvailableProducts = async () => {
  loadingProducts.value = true
  try {
    const res = await authenticatedFetch('/api/inventory/products-without-control')
    availableProducts.value = res.products || []
  } catch {
    availableProducts.value = []
  } finally {
    loadingProducts.value = false
  }
}

const onProductSelect = () => {
  const pid = createForm.value.productId
  if (!pid) return
  const p = availableProducts.value.find(x => x._id === pid)
  if (!p) return
  createForm.value.name = p.name
  if (p.category?.name) createForm.value.category = p.category.name
}

const openCreateModal = () => {
  createForm.value = { type: 'produto', name: '', category: '', unit: 'un', productId: '', initialStock: 0, minStock: 0, costPrice: 0 }
  createError.value = ''
  showCreateModal.value = true
  loadAvailableProducts()
}

const createItem = async () => {
  createError.value = ''
  if (createForm.value.type === 'produto' && !createForm.value.productId) { createError.value = 'Selecione o produto do cardápio'; return }
  if (!createForm.value.name.trim()) { createError.value = 'Nome é obrigatório'; return }
  if (!createForm.value.category.trim()) { createError.value = 'Categoria é obrigatória'; return }
  creating.value = true
  try {
    const res = await authenticatedFetch('/api/inventory', {
      method: 'POST',
      body: {
        name: createForm.value.name,
        type: createForm.value.type,
        category: createForm.value.category,
        unit: createForm.value.unit,
        productId: createForm.value.type === 'produto' ? createForm.value.productId : null,
        initialStock: createForm.value.initialStock,
        minStock: createForm.value.minStock,
        costPrice: createForm.value.costPrice
      }
    })
    items.value.push(res)
    items.value.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    activeTab.value = createForm.value.category
    showCreateModal.value = false
    showToast('Item adicionado ao estoque!')
  } catch (err) {
    createError.value = err?.data?.message || 'Erro ao criar item'
  } finally {
    creating.value = false
  }
}

const openAdjust = (item, type) => {
  adjustItem.value = item
  adjustForm.value = { type, quantity: null, reason: '' }
  adjustError.value = ''
  showAdjustModal.value = true
}

const saveAdjust = async () => {
  adjustError.value = ''
  const qty = Number(adjustForm.value.quantity)
  if (!qty || qty <= 0) {
    adjustError.value = 'Informe uma quantidade válida'
    return
  }
  if (!adjustItem.value?._id) {
    adjustError.value = 'Item inválido'
    return
  }
  adjusting.value = true
  try {
    const token = process.client ? localStorage.getItem('auth_token') : null
    const res = await $fetch(`/api/inventory/${adjustItem.value._id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        adjustType: adjustForm.value.type,
        quantity: qty,
        reason: adjustForm.value.reason || ''
      }
    })
    // Substituir o item na lista com o novo estoque (garante reatividade no Vue)
    const idx = items.value.findIndex(i => i._id === adjustItem.value._id)
    if (idx !== -1) {
      items.value[idx] = { ...items.value[idx], currentStock: res.currentStock }
    }
    showAdjustModal.value = false
    showToast(adjustForm.value.type === 'entrada' ? 'Entrada registrada!' : 'Saída registrada!')
  } catch (err) {
    const msg = err?.data?.message || err?.data?.statusMessage || err?.message || 'Erro ao ajustar estoque'
    adjustError.value = msg
    showToast(msg, 'error')
  } finally {
    adjusting.value = false
  }
}

const openEdit = (item) => {
  editItem.value = item
  editForm.value = {
    name: item.name,
    category: item.category,
    unit: item.unit,
    currentStock: item.currentStock,
    minStock: item.minStock,
    costPrice: item.costPrice
  }
  showEditModal.value = true
}

const saveEdit = async () => {
  editing.value = true
  try {
    const token = process.client ? localStorage.getItem('auth_token') : null
    await $fetch(`/api/inventory/${editItem.value._id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        name: editForm.value.name,
        category: editForm.value.category,
        unit: editForm.value.unit,
        currentStock: editForm.value.currentStock,
        minStock: editForm.value.minStock,
        costPrice: editForm.value.costPrice
      }
    })
    const idx = items.value.findIndex(i => i._id === editItem.value._id)
    if (idx !== -1) Object.assign(items.value[idx], editForm.value)
    showEditModal.value = false
    showToast('Item atualizado!')
    // Propagar nome atualizado para todos os produtos que usam este ingrediente
    syncRecipeNames()
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Erro ao atualizar'
    showToast(msg, 'error')
  } finally {
    editing.value = false
  }
}

const confirmRemove = (item) => {
  removeTarget.value = item
  showRemoveModal.value = true
}

const removeItem = async () => {
  removing.value = true
  try {
    const token = process.client ? localStorage.getItem('auth_token') : null
    await $fetch(`/api/inventory/${removeTarget.value._id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    items.value = items.value.filter(i => i._id !== removeTarget.value._id)
    showRemoveModal.value = false
    showToast('Item removido')
  } catch (err) {
    showToast(err?.data?.message || 'Erro ao remover item', 'error')
  } finally {
    removing.value = false
  }
}

const startEditMinStock = (item) => {
  editingMinStockId.value = item._id
  editingMinStockValue.value = item.minStock
}

const saveMinStock = async (item) => {
  if (editingMinStockId.value !== item._id) return
  editingMinStockId.value = null
  const newMin = Math.max(0, Number(editingMinStockValue.value) || 0)
  if (newMin === item.minStock) return
  try {
    const token = process.client ? localStorage.getItem('auth_token') : null
    await $fetch(`/api/inventory/${item._id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: { minStock: newMin }
    })
    const idx = items.value.findIndex(i => i._id === item._id)
    if (idx !== -1) items.value[idx] = { ...items.value[idx], minStock: newMin }
    showToast('Estoque mínimo atualizado!')
  } catch {
    showToast('Erro ao atualizar mínimo', 'error')
  }
}

// Ao trocar tipo no modal, limpa o produto selecionado
watch(() => createForm.value.type, (newType) => {
  createForm.value.productId = ''
  createForm.value.name = ''
  createForm.value.category = ''
  if (newType === 'produto' && showCreateModal.value) {
    loadAvailableProducts()
  }
})

const syncRecipeNames = async () => {
  try {
    const token = process.client ? localStorage.getItem('auth_token') : null
    await $fetch('/api/inventory/sync-recipe-names', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
  } catch { /* silencioso — não interrompe o fluxo */ }
}

onMounted(async () => {
  await loadItems()
  syncRecipeNames() // Sincroniza nomes na abertura da página (corrige nomes antigos)
})
</script>

<style scoped>
.inventory-page { max-width: 900px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
.header-left h1 { margin: 0; font-size: 1.75rem; font-weight: 700; color: #1e293b; }
.page-desc { margin: 0.25rem 0 0; color: #6b7280; font-size: 0.9rem; }

/* Summary */
.summary-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.sum-card { flex: 1; background: white; border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .25rem; }
.sum-num { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
.sum-label { font-size: .8125rem; color: #64748b; }
.sum-warn .sum-num { color: #d97706; }
.sum-danger .sum-num { color: #ef4444; }

/* Tabs */
.tabs-bar { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.tab-btn { padding: .5rem .875rem; border: 1px solid #e2e8f0; border-radius: 2rem; background: white; color: #64748b; font-size: .875rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: .375rem; transition: all .15s; }
.tab-btn:hover { border-color: #ff8e24; color: #ff8e24; }
.tab-active { background: #ff8e24; color: white !important; border-color: #ff8e24 !important; }
.tab-count { background: rgba(0,0,0,.12); border-radius: 99px; padding: .1rem .45rem; font-size: .75rem; font-weight: 700; }
.tab-active .tab-count { background: rgba(255,255,255,.25); }

/* Items */
.items-list { display: flex; flex-direction: column; gap: .625rem; }
.item-card { background: white; border: 1px solid #e2e8f0; border-left: 4px solid #e2e8f0; border-radius: .75rem; padding: 1rem 1.125rem; display: flex; align-items: center; gap: 1rem; transition: box-shadow .15s; }
.item-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.item-card.low { border-left-color: #f59e0b; }
.item-card.zero { border-left-color: #ef4444; }
.item-card.ok { border-left-color: #22c55e; }

.item-main { flex: 1; min-width: 0; }
.item-header-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .375rem; }
.item-name-wrap { display: flex; align-items: center; gap: .5rem; min-width: 0; }
.item-name { font-size: 1rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-type-badge { font-size: .65rem; font-weight: 700; padding: .15rem .5rem; border-radius: .25rem; text-transform: uppercase; letter-spacing: .04em; flex-shrink: 0; }
.badge-produto { background: #dbeafe; color: #1d4ed8; }
.badge-ingr { background: #fef3c7; color: #92400e; }

.stock-badge { display: flex; align-items: baseline; gap: .25rem; flex-shrink: 0; }
.stock-num { font-size: 1.375rem; font-weight: 700; }
.stock-unit { font-size: .8125rem; color: #64748b; }
.ok .stock-num { color: #16a34a; }
.low .stock-num { color: #d97706; }
.zero .stock-num { color: #ef4444; }

.item-meta { display: flex; flex-wrap: wrap; gap: .5rem; }
.meta-item { font-size: .8rem; color: #64748b; }
.meta-link { color: #6366f1; }
.meta-warn { color: #d97706; font-weight: 600; }
.meta-danger { color: #ef4444; font-weight: 600; }
.meta-min-editable { cursor: pointer; display: inline-flex; align-items: center; gap: .2rem; border-radius: .25rem; padding: .05rem .25rem; transition: background .15s; }
.meta-min-editable:hover { background: #f1f5f9; color: #374151; }
.meta-min-input-wrap { display: inline-flex; align-items: center; gap: .3rem; }
.min-stock-input { width: 4rem; padding: .1rem .35rem; border: 1.5px solid #ff8e24; border-radius: .375rem; font-size: .8rem; font-weight: 600; color: #1e293b; text-align: center; outline: none; }

.item-actions { display: flex; gap: .375rem; flex-shrink: 0; }
.btn-adj { display: flex; align-items: center; gap: .25rem; padding: .4rem .7rem; border-radius: .5rem; font-size: .8rem; font-weight: 600; cursor: pointer; border: 1px solid; transition: all .15s; background: white; }
.btn-entrada { color: #16a34a; border-color: #16a34a; }
.btn-entrada:hover { background: #16a34a; color: white; }
.btn-saida { color: #ef4444; border-color: #ef4444; }
.btn-saida:hover { background: #ef4444; color: white; }
.btn-edit { color: #6366f1; border-color: #6366f1; padding: .4rem .6rem; }
.btn-edit:hover { background: #6366f1; color: white; }
.btn-remove { color: #94a3b8; border-color: #e2e8f0; padding: .4rem .6rem; }
.btn-remove:hover { background: #ef4444; color: white; border-color: #ef4444; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 1rem; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal-sm { max-width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #1e293b; }
.close-btn { background: none; border: none; color: #6b7280; cursor: pointer; padding: .25rem; border-radius: .25rem; }
.close-btn:hover { background: #f3f4f6; }
.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.125rem; }

/* Type selector */
.type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.type-opt { display: flex; flex-direction: column; align-items: center; gap: .25rem; padding: 1rem; border: 2px solid #e2e8f0; border-radius: .75rem; background: white; cursor: pointer; transition: all .15s; color: #374151; }
.type-opt span { font-weight: 600; font-size: .9375rem; }
.type-opt small { font-size: .75rem; color: #94a3b8; }
.type-opt-active { border-color: #ff8e24; background: #fff7ed; color: #ff8e24; }
.type-opt-active small { color: #fb923c; }

.info-box { display: flex; gap: .625rem; padding: .75rem 1rem; border-radius: .625rem; font-size: .875rem; line-height: 1.5; }
.info-blue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.info-warn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.form-full-block { display: flex; flex-direction: column; gap: .375rem; }
.form-full-block label { font-size: .875rem; font-weight: 500; color: #374151; }
.form-full-block select { padding: .625rem .75rem; border: 1px solid #d1d5db; border-radius: .5rem; font-size: .9375rem; }
.form-full-block select:focus { outline: none; border-color: #ff8e24; box-shadow: 0 0 0 3px rgba(255,142,36,.1); }
.products-loading { font-size: .875rem; color: #6b7280; padding: .5rem 0; }

/* Form */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
.form-full { grid-column: 1 / -1; }
.form-group { display: flex; flex-direction: column; gap: .375rem; }
.form-group label { font-size: .875rem; font-weight: 500; color: #374151; }
.form-group input, .form-group select { padding: .625rem .75rem; border: 1px solid #d1d5db; border-radius: .5rem; font-size: .9375rem; }
.form-group input:focus, .form-group select:focus { outline: none; border-color: #ff8e24; box-shadow: 0 0 0 3px rgba(255,142,36,.1); }
.form-error { color: #ef4444; font-size: .875rem; background: #fee2e2; padding: .625rem .875rem; border-radius: .5rem; margin: 0; }

.modal-actions { display: flex; gap: .75rem; justify-content: flex-end; }

/* Adjust modal */
.adjust-modal-header { display: flex; align-items: center; gap: .875rem; padding: 1.25rem 1.5rem; border-radius: 1rem 1rem 0 0; color: white; position: relative; }
.adj-header-entrada { background: linear-gradient(135deg, #16a34a, #22c55e); }
.adj-header-saida { background: linear-gradient(135deg, #dc2626, #ef4444); }
.adj-header-icon { width: 2.5rem; height: 2.5rem; background: rgba(255,255,255,.2); border-radius: .625rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.adjust-modal-header h2 { margin: 0; font-size: 1.0625rem; font-weight: 700; }
.adjust-modal-header p { margin: .1rem 0 0; font-size: .85rem; opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
.adj-close-btn { margin-left: auto; background: rgba(255,255,255,.2); border: none; color: white; border-radius: .5rem; width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background .15s; }
.adj-close-btn:hover { background: rgba(255,255,255,.35); }

.adj-stock-row { display: flex; align-items: center; gap: .75rem; background: #f8fafc; border-radius: .75rem; padding: 1rem; }
.adj-stock-box { flex: 1; display: flex; flex-direction: column; gap: .25rem; text-align: center; }
.adj-stock-label { font-size: .75rem; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
.adj-stock-val { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.adj-stock-val small { font-size: .85rem; font-weight: 400; color: #64748b; }
.adj-stock-new .adj-stock-val { color: #64748b; }
.adj-val-entrada { color: #16a34a !important; }
.adj-val-saida { color: #ef4444 !important; }
.adj-arrow { flex-shrink: 0; }

.adj-qty-input { font-size: 1.5rem !important; font-weight: 700 !important; text-align: center; padding: .875rem !important; }

.adjust-target { background: #f8fafc; border-radius: .625rem; padding: .75rem 1rem; display: flex; justify-content: space-between; align-items: center; font-size: .9375rem; }

/* Buttons */
.btn-primary { display: inline-flex; align-items: center; gap: .5rem; padding: .75rem 1.5rem; background: #ff8e24; color: white; border: none; border-radius: .75rem; font-size: .875rem; font-weight: 600; cursor: pointer; transition: background .2s; }
.btn-primary:hover:not(:disabled) { background: #e67e22; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-danger { background: #ef4444 !important; }
.btn-danger:hover:not(:disabled) { background: #dc2626 !important; }
.btn-secondary { padding: .75rem 1.5rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: .75rem; font-size: .875rem; font-weight: 500; cursor: pointer; }
.btn-secondary:hover:not(:disabled) { background: #f9fafb; }
.btn-secondary:disabled { opacity: .5; cursor: not-allowed; }

/* Loading / empty */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: #6b7280; }
.spinner { width: 2rem; height: 2rem; border: 3px solid #e5e7eb; border-top-color: #ff8e24; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-cat { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 3rem; color: #94a3b8; text-align: center; }
.empty-cat p { margin: 0; }

/* Toast */
.toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); padding: .875rem 1.5rem; border-radius: .75rem; font-weight: 600; font-size: .9375rem; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,.15); }
.toast.success { background: #16a34a; color: white; }
.toast.error { background: #ef4444; color: white; }

@media (max-width: 640px) {
  .summary-row { flex-wrap: wrap; }
  .sum-card { min-width: calc(50% - .5rem); }
  .item-card { flex-direction: column; align-items: flex-start; }
  .item-actions { width: 100%; justify-content: flex-end; }
  .form-grid { grid-template-columns: 1fr; }
  .type-selector { grid-template-columns: 1fr; }
}
</style>
