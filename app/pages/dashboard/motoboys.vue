<template>
  <div class="motoboys-page">
    <div class="page-header">
      <div class="header-left">
        <h1>Motoboys</h1>
        <p class="page-description">Cadastre e gerencie os entregadores da loja.</p>
      </div>
      <div class="header-actions">
        <button v-if="abaAtiva === 'lista'" @click="abrirModal()" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo Motoboy
        </button>
        <button v-if="abaAtiva === 'relatorio'" @click="imprimirRelatorio()" class="btn-secondary-outline">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Imprimir
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button @click="abaAtiva = 'lista'" class="tab-btn" :class="{ active: abaAtiva === 'lista' }">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"></circle>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path>
        </svg>
        Motoboys
      </button>
      <button @click="abrirRelatorio()" class="tab-btn" :class="{ active: abaAtiva === 'relatorio' }">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        Relatório de Fretes
      </button>
    </div>

    <!-- ===== ABA: LISTA ===== -->
    <div v-if="abaAtiva === 'lista'">
      <div class="motoboys-list">
        <div v-if="loading" class="loading-state">
          <div class="skeleton-card" v-for="n in 3" :key="n"></div>
        </div>

        <div v-else-if="motoboys.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path>
          </svg>
          <h3>Nenhum motoboy cadastrado</h3>
          <p>Cadastre o primeiro entregador da loja</p>
          <button @click="abrirModal()" class="btn-primary">Cadastrar Motoboy</button>
        </div>

        <div v-else class="motoboys-grid">
          <div v-for="m in motoboys" :key="m._id" class="motoboy-card">
            <div class="motoboy-avatar">
              <img v-if="m.foto" :src="m.foto" :alt="m.nome" class="avatar-img" />
              <span v-else>{{ m.nome.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="motoboy-info">
              <h3>{{ m.nome }}</h3>
              <p><strong>Tel:</strong> {{ m.telefone }}</p>
              <p v-if="m.placa"><strong>Placa:</strong> {{ m.placa }}</p>
              <p v-if="m.cpf"><strong>CPF:</strong> {{ m.cpf }}</p>
            </div>
            <div class="motoboy-actions">
              <span class="status-badge" :class="m.status ? 'active' : 'inactive'">
                {{ m.status ? 'Ativo' : 'Inativo' }}
              </span>
              <!-- Presença hoje -->
              <button
                @click="togglePresenca(m)"
                class="btn-presenca"
                :class="m.trabalhouHoje ? 'presente' : 'ausente'"
                :title="m.trabalhouHoje ? 'Veio hoje — clique para desmarcar' : 'Não veio hoje — clique para marcar'"
              >
                <svg v-if="m.trabalhouHoje" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                {{ m.trabalhouHoje ? 'Veio hoje' : 'Não veio' }}
              </button>
              <div class="card-btns">
                <button @click="abrirModal(m)" class="btn-edit" title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button @click="confirmDelete(m)" class="btn-delete" title="Excluir">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14H6L5 6"></path>
                    <path d="M10 11v6"></path>
                    <path d="M14 11v6"></path>
                    <path d="M9 6V4h6v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== ABA: RELATÓRIO ===== -->
    <div v-if="abaAtiva === 'relatorio'" class="relatorio-section">
      <!-- Filtros de período -->
      <div class="periodo-filters">
        <button
          v-for="p in periodos"
          :key="p.value"
          @click="setPeriodo(p.value)"
          class="periodo-btn"
          :class="{ active: periodoAtivo === p.value }"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="relatorioLoading" class="loading-state">
        <div class="skeleton-card" v-for="n in 3" :key="n"></div>
      </div>

      <!-- Resumo geral -->
      <div v-else>
        <div class="resumo-cards">
          <div class="resumo-card">
            <div class="resumo-icon resumo-icon-blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13" rx="2"></rect>
                <path d="M16 8h4l3 3v5h-7V8z"></path>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div>
              <p class="resumo-label">Total de Entregas</p>
              <p class="resumo-valor">{{ relatorio.totalEntregas }}</p>
            </div>
          </div>
          <div class="resumo-card">
            <div class="resumo-icon resumo-icon-green">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div>
              <p class="resumo-label">Total em Fretes</p>
              <p class="resumo-valor">{{ formatCurrency(relatorio.totalGeral) }}</p>
            </div>
          </div>
          <div class="resumo-card">
            <div class="resumo-icon resumo-icon-orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path>
              </svg>
            </div>
            <div>
              <p class="resumo-label">Motoboys Ativos</p>
              <p class="resumo-valor">{{ relatorio.motoboys ? relatorio.motoboys.length : 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Sem dados -->
        <div v-if="!relatorio.motoboys || relatorio.motoboys.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <h3>Nenhuma entrega no período</h3>
          <p>Não há pedidos com motoboy atribuído {{ periodoLabel }}</p>
        </div>

        <!-- Cards por motoboy -->
        <div v-else class="relatorio-lista">
          <div v-for="(m, idx) in relatorio.motoboys" :key="m.motoboyId" class="relatorio-card">
            <div class="relatorio-rank">#{{ idx + 1 }}</div>
            <div class="relatorio-avatar">
              <img v-if="m.foto" :src="m.foto" :alt="m.motoboyNome" class="avatar-img" />
              <span v-else>{{ (m.motoboyNome || '?').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="relatorio-info">
              <h3>{{ m.motoboyNome || 'Desconhecido' }}</h3>
              <div class="relatorio-stats">
                <span class="stat-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13" rx="2"></rect>
                    <path d="M16 8h4l3 3v5h-7V8z"></path>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  {{ m.totalEntregas }} entrega{{ m.totalEntregas !== 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <div class="relatorio-frete">
              <p class="frete-valor">{{ formatCurrency(m.totalFretes) }}</p>
              <p class="frete-label">em fretes</p>
            </div>
            <!-- Barra de progresso relativa ao maior -->
            <div class="relatorio-barra-wrap">
              <div
                class="relatorio-barra"
                :style="{ width: calcBarra(m.totalFretes) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal cadastro/edição -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editando ? 'Editar Motoboy' : 'Novo Motoboy' }}</h2>
          <button @click="closeModal" class="btn-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form @submit.prevent="salvar" class="modal-form">

          <!-- Foto -->
          <div class="foto-upload-area">
            <div class="foto-preview" @click="fotoInput.click()">
              <img v-if="form.foto" :src="form.foto" alt="Foto" class="foto-preview-img" />
              <div v-else class="foto-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Adicionar foto</span>
              </div>
              <div v-if="form.foto" class="foto-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Alterar</span>
              </div>
            </div>
            <input ref="fotoInput" type="file" accept="image/*" style="display:none" @change="handleFoto" :key="showModal" />
            <button v-if="form.foto" type="button" class="btn-remove-foto" @click="form.foto = ''">Remover foto</button>
          </div>

          <div class="form-group">
            <label>Nome *</label>
            <input v-model="form.nome" type="text" placeholder="Nome completo" required />
          </div>
          <div class="form-group">
            <label>Telefone *</label>
            <input v-model="form.telefone" type="text" placeholder="(00) 00000-0000" required />
          </div>
          <div class="form-group">
            <label>Placa da Moto</label>
            <input v-model="form.placa" type="text" placeholder="ABC-1234" />
          </div>
          <div class="form-group">
            <label>CPF</label>
            <input v-model="form.cpf" type="text" placeholder="000.000.000-00" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="form.status">
              <option :value="true">Ativo</option>
              <option :value="false">Inativo</option>
            </select>
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Salvando...' : (editando ? 'Salvar' : 'Cadastrar') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal exclusão -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>Excluir Motoboy</h2>
        </div>
        <p>Tem certeza que deseja excluir <strong>{{ deleteTarget.nome }}</strong>?</p>
        <div class="modal-footer">
          <button @click="deleteTarget = null" class="btn-secondary">Cancelar</button>
          <button @click="deletar" class="btn-danger" :disabled="deleting">
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' })

// ===== ABA =====
const abaAtiva = ref('lista')

// ===== LISTA =====
const motoboys = ref([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const formError = ref('')
const deleteTarget = ref(null)
const deleting = ref(false)
const editando = ref(null)

const fotoInput = ref(null)
const formVazio = () => ({ nome: '', telefone: '', placa: '', cpf: '', status: true, foto: '', trabalhouHoje: false })
const form = ref(formVazio())

// ===== RELATÓRIO =====
const periodoAtivo = ref('today')
const relatorioLoading = ref(false)
const relatorio = ref({ motoboys: [], totalGeral: 0, totalEntregas: 0 })

const periodos = [
  { label: 'Hoje', value: 'today' },
  { label: 'Esta Semana', value: 'week' },
  { label: 'Este Mês', value: 'month' }
]

const periodoLabel = computed(() => {
  if (periodoAtivo.value === 'today') return 'hoje'
  if (periodoAtivo.value === 'week') return 'esta semana'
  return 'este mês'
})

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

const calcBarra = (val) => {
  const max = relatorio.value.motoboys?.[0]?.totalFretes || 1
  return Math.round((val / max) * 100)
}

const carregarRelatorio = async () => {
  relatorioLoading.value = true
  try {
    const res = await fetch(`/api/motoboys/relatorio?period=${periodoAtivo.value}`, { headers: getAuthHeader() })
    relatorio.value = await res.json()
  } catch (e) {
    console.error('Erro ao carregar relatório:', e)
  } finally {
    relatorioLoading.value = false
  }
}

const setPeriodo = (p) => {
  periodoAtivo.value = p
  carregarRelatorio()
}

const abrirRelatorio = () => {
  abaAtiva.value = 'relatorio'
  carregarRelatorio()
}

const imprimirRelatorio = () => {
  window.print()
}

// ===== FOTO =====
const handleFoto = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { formError.value = 'Imagem muito grande. Máximo 5MB.'; return }
  const reader = new FileReader()
  reader.onload = (ev) => { form.value.foto = ev.target.result }
  reader.readAsDataURL(file)
}

// ===== CRUD =====
const abrirModal = (m = null) => {
  editando.value = m
  form.value = m
    ? { nome: m.nome, telefone: m.telefone, placa: m.placa || '', cpf: m.cpf || '', status: m.status, foto: m.foto || '', trabalhouHoje: m.trabalhouHoje ?? false }
    : formVazio()
  formError.value = ''
  showModal.value = true
}

const carregar = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/motoboys', { headers: getAuthHeader() })
    motoboys.value = await res.json()
  } catch (e) {
    console.error('Erro ao carregar motoboys:', e)
  } finally {
    loading.value = false
  }
}

const salvar = async () => {
  formError.value = ''
  saving.value = true
  try {
    const url = editando.value ? `/api/motoboys/${editando.value._id}` : '/api/motoboys'
    const method = editando.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(form.value)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      formError.value = err.statusMessage || 'Erro ao salvar'
      return
    }
    closeModal()
    await carregar()
  } catch (e) {
    formError.value = 'Erro ao salvar motoboy'
  } finally {
    saving.value = false
  }
}

const togglePresenca = async (m) => {
  const novoValor = !m.trabalhouHoje
  m.trabalhouHoje = novoValor
  m.status = novoValor // veio hoje = ativo, não veio = inativo
  try {
    await fetch(`/api/motoboys/${m._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ ...m, trabalhouHoje: novoValor, status: novoValor })
    })
  } catch (e) {
    m.trabalhouHoje = !novoValor
    m.status = !novoValor
  }
}

const confirmDelete = (m) => { deleteTarget.value = m }

const deletar = async () => {
  deleting.value = true
  try {
    await fetch(`/api/motoboys/${deleteTarget.value._id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
    deleteTarget.value = null
    await carregar()
  } catch (e) {
    console.error('Erro ao excluir:', e)
  } finally {
    deleting.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  editando.value = null
  form.value = formVazio()
  formError.value = ''
}

onMounted(carregar)
</script>

<style scoped>
.motoboys-page { padding: 0; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-description { color: var(--color-text-secondary); margin: 0.25rem 0 0; font-size: 0.9rem; }
.header-actions { display: flex; gap: 0.75rem; }

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid rgba(0,0,0,0.08);
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.tab-btn:hover:not(.active) { color: var(--color-text-primary); }

/* Motoboys grid */
.motoboys-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.motoboy-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.06);
}

.motoboy-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }

.motoboy-info { flex: 1; min-width: 0; }
.motoboy-info h3 { margin: 0 0 0.25rem; font-size: 1rem; }
.motoboy-info p { margin: 0.15rem 0; font-size: 0.85rem; color: var(--color-text-secondary); }

.motoboy-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}
.status-badge.active { background: #dcfce7; color: #16a34a; }
.status-badge.inactive { background: #fee2e2; color: #dc2626; }

.btn-presenca {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-presenca.presente { background: #dbeafe; color: #1d4ed8; }
.btn-presenca.ausente { background: #f3f4f6; color: #6b7280; }
.btn-presenca:hover { opacity: 0.8; }

.card-btns { display: flex; gap: 0.3rem; }

.btn-edit, .btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: var(--radius-sm);
  transition: color 0.2s, background 0.2s;
  color: var(--color-text-secondary);
}
.btn-edit:hover { color: var(--color-primary); background: rgba(255,142,36,0.1); }
.btn-delete:hover { color: #dc2626; background: #fee2e2; }

/* Empty / loading */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.empty-state h3 { margin: 0; color: var(--color-text-primary); }
.empty-state p { margin: 0; }

.loading-state { display: flex; flex-direction: column; gap: 1rem; }
.skeleton-card {
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-lg);
}
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* ===== RELATÓRIO ===== */
.relatorio-section { display: flex; flex-direction: column; gap: 1.25rem; }

.periodo-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.periodo-btn {
  padding: 0.45rem 1.1rem;
  border-radius: 999px;
  border: 1.5px solid rgba(0,0,0,0.15);
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}
.periodo-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
.periodo-btn:hover:not(.active) { border-color: var(--color-primary); color: var(--color-primary); }

.resumo-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 0.25rem;
}
.resumo-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.06);
}
.resumo-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.resumo-icon-blue { background: #dbeafe; color: #1d4ed8; }
.resumo-icon-green { background: #dcfce7; color: #16a34a; }
.resumo-icon-orange { background: #ffedd5; color: #ea580c; }
.resumo-label { margin: 0; font-size: 0.8rem; color: var(--color-text-secondary); }
.resumo-valor { margin: 0.1rem 0 0; font-size: 1.3rem; font-weight: 700; color: var(--color-text-primary); }

.relatorio-lista { display: flex; flex-direction: column; gap: 0.75rem; }

.relatorio-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.06);
  position: relative;
  overflow: hidden;
}

.relatorio-rank {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.relatorio-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}

.relatorio-info { flex: 1; min-width: 0; }
.relatorio-info h3 { margin: 0 0 0.2rem; font-size: 0.95rem; font-weight: 600; }
.relatorio-stats { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.relatorio-frete { text-align: right; flex-shrink: 0; }
.frete-valor { margin: 0; font-size: 1.1rem; font-weight: 700; color: #16a34a; }
.frete-label { margin: 0; font-size: 0.75rem; color: var(--color-text-secondary); }

.relatorio-barra-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0,0,0,0.05);
}
.relatorio-barra {
  height: 100%;
  background: var(--color-primary);
  border-radius: 0 2px 2px 0;
  transition: width 0.4s ease;
}

/* Foto */
.foto-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.foto-preview {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px dashed rgba(0,0,0,0.2);
  cursor: pointer;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}
.foto-preview:hover { border-color: var(--color-primary); }
.foto-preview-img { width: 100%; height: 100%; object-fit: cover; }
.foto-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  text-align: center;
  padding: 0.5rem;
}
.foto-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
  font-size: 0.75rem;
}
.foto-preview:hover .foto-overlay { opacity: 1; }
.btn-remove-foto {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

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
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-small { max-width: 360px; }
.modal-small p { margin: 0.5rem 0 1.5rem; }
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.modal-header h2 { margin: 0; font-size: 1.25rem; }
.btn-close { background: none; border: none; cursor: pointer; color: var(--color-text-secondary); padding: 0.25rem; }
.btn-close:hover { color: var(--color-text-primary); }
.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.875rem; font-weight: 500; }
.form-group input, .form-group select {
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.85rem;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
}
.form-group input:focus, .form-group select:focus { outline: none; border-color: var(--color-primary); }
.form-error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.modal-footer { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.btn-secondary-outline {
  background: transparent;
  border: 1.5px solid rgba(0,0,0,0.2);
  padding: 0.6rem 1.1rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
  color: var(--color-text-secondary);
}
.btn-secondary-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(0,0,0,0.2);
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-secondary:hover { background: #f5f5f5; }
.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

@media print {
  .tabs-bar, .periodo-filters, .page-header .header-actions { display: none !important; }
  .relatorio-card { box-shadow: none; border: 1px solid #e5e7eb; }
}
</style>
