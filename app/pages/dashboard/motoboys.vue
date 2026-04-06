<template>
  <div class="motoboys-page">
    <div class="page-header">
      <div class="header-left">
        <h1>Motoboys</h1>
        <p class="page-description">Cadastre e gerencie os entregadores da loja.</p>
      </div>
      <div class="header-actions">
        <button @click="showModal = true" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo Motoboy
        </button>
      </div>
    </div>

    <!-- Lista -->
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
        <button @click="showModal = true" class="btn-primary">Cadastrar Motoboy</button>
      </div>

      <div v-else class="motoboys-grid">
        <div v-for="m in motoboys" :key="m._id" class="motoboy-card">
          <div class="motoboy-avatar">
            {{ m.nome.charAt(0).toUpperCase() }}
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
            <button @click="confirmDelete(m)" class="btn-delete" title="Excluir">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

    <!-- Modal cadastro -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Novo Motoboy</h2>
          <button @click="closeModal" class="btn-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form @submit.prevent="salvar" class="modal-form">
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
              {{ saving ? 'Salvando...' : 'Cadastrar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal confirmação exclusão -->
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

const motoboys = ref([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const formError = ref('')
const deleteTarget = ref(null)
const deleting = ref(false)

const form = ref({ nome: '', telefone: '', placa: '', cpf: '', status: true })

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const carregar = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/motoboys', { headers: getAuthHeader() })
    const data = await res.json()
    motoboys.value = data
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
    const res = await fetch('/api/motoboys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(form.value)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      formError.value = err.statusMessage || 'Erro ao cadastrar'
      return
    }
    closeModal()
    await carregar()
  } catch (e) {
    formError.value = 'Erro ao cadastrar motoboy'
  } finally {
    saving.value = false
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
  form.value = { nome: '', telefone: '', placa: '', cpf: '', status: true }
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
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-description { color: var(--color-text-secondary); margin: 0.25rem 0 0; font-size: 0.9rem; }

.header-actions { display: flex; gap: 0.75rem; }

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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.motoboy-info { flex: 1; min-width: 0; }
.motoboy-info h3 { margin: 0 0 0.25rem; font-size: 1rem; }
.motoboy-info p { margin: 0.15rem 0; font-size: 0.85rem; color: var(--color-text-secondary); }

.motoboy-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}
.status-badge.active { background: #dcfce7; color: #16a34a; }
.status-badge.inactive { background: #fee2e2; color: #dc2626; }

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: color 0.2s, background 0.2s;
}
.btn-delete:hover { color: #dc2626; background: #fee2e2; }

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
</style>
