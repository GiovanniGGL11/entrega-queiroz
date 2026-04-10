<template>
  <div class="employees-page">
    <div class="page-header">
      <div class="header-left">
        <h1>Funcionários</h1>
        <p class="page-description">Gerencie os acessos da sua equipe</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Novo Funcionário
      </button>
    </div>

    <!-- Info card -->
    <div class="info-card">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
      <div>
        <strong>Acesso do Funcionário</strong>
        <p>O funcionário pode ver e gerenciar <strong>Pedidos</strong>, <strong>Motoboys</strong> e <strong>Estoque</strong>. Não tem acesso a dados financeiros, configurações, clientes ou cupons.</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando...</p>
    </div>

    <!-- Vazio -->
    <div v-else-if="employees.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <h3>Nenhum funcionário cadastrado</h3>
      <p>Crie um acesso para sua equipe</p>
      <button @click="showCreateModal = true" class="btn-primary">Cadastrar Funcionário</button>
    </div>

    <!-- Lista -->
    <div v-else class="employees-list">
      <div v-for="emp in employees" :key="emp._id" class="employee-card">
        <div class="emp-avatar">{{ (emp.name || emp.email).charAt(0).toUpperCase() }}</div>
        <div class="emp-info">
          <h3>{{ emp.name || '—' }}</h3>
          <p>{{ emp.email }}</p>
          <span class="emp-since">Desde {{ formatDate(emp.createdAt) }}</span>
        </div>
        <div class="emp-badge">Funcionário</div>
        <button @click="confirmDelete(emp)" class="btn-delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
          </svg>
          Remover
        </button>
      </div>
    </div>

    <!-- Modal criar funcionário -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Novo Funcionário</h2>
          <button @click="closeModal" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form @submit.prevent="createEmployee" class="modal-form">
          <div class="form-group">
            <label>Nome *</label>
            <input v-model="form.name" type="text" placeholder="Nome completo" required :disabled="submitting" />
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input v-model="form.email" type="email" placeholder="email@exemplo.com" required :disabled="submitting" />
          </div>
          <div class="form-group">
            <label>Senha *</label>
            <div class="password-wrapper">
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" placeholder="Mínimo 6 caracteres" required :disabled="submitting" minlength="6" />
              <button type="button" @click="showPwd = !showPwd" class="toggle-pwd">
                <svg v-if="!showPwd" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="access-summary">
            <h4>Permissões de acesso</h4>
            <div class="access-grid">
              <div class="access-item allowed">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Pedidos
              </div>
              <div class="access-item allowed">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Motoboys
              </div>
              <div class="access-item allowed">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Estoque
              </div>
              <div class="access-item denied">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Dashboard / Financeiro
              </div>
              <div class="access-item denied">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Clientes / Cupons
              </div>
              <div class="access-item denied">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Configurações
              </div>
            </div>
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary" :disabled="submitting">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Salvando...' : 'Criar Acesso' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal confirmar exclusão -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="delete-modal" @click.stop>
        <div class="delete-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2>Remover Funcionário</h2>
        <p>Tem certeza que deseja remover o acesso de <strong>{{ empToDelete?.name || empToDelete?.email }}</strong>?</p>
        <p class="warn-text">Esta ação não pode ser desfeita.</p>
        <div class="delete-actions">
          <button @click="showDeleteModal = false" class="btn-secondary">Cancelar</button>
          <button @click="deleteEmployee" class="btn-delete-confirm" :disabled="deleting">
            {{ deleting ? 'Removendo...' : 'Sim, Remover' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" :class="['toast', toast.type]">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

definePageMeta({ layout: 'dashboard' })

const { authenticatedFetch } = useAuthenticatedFetch()

const loading = ref(true)
const employees = ref([])
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const showPwd = ref(false)
const empToDelete = ref(null)
const formError = ref('')

const form = ref({ name: '', email: '', password: '' })

const toast = ref({ show: false, type: 'success', message: '' })

const showToast = (msg, type = 'success') => {
  toast.value = { show: true, type, message: msg }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const loadEmployees = async () => {
  loading.value = true
  try {
    const data = await authenticatedFetch('/api/dashboard/employees')
    employees.value = data
  } catch {
    showToast('Erro ao carregar funcionários', 'error')
  } finally {
    loading.value = false
  }
}

const createEmployee = async () => {
  formError.value = ''
  submitting.value = true
  try {
    const res = await authenticatedFetch('/api/dashboard/employees', {
      method: 'POST',
      body: { name: form.value.name, email: form.value.email, password: form.value.password }
    })
    employees.value.push(res.employee)
    showToast('Funcionário criado com sucesso!')
    closeModal()
  } catch (err) {
    formError.value = err.data?.message || 'Erro ao criar funcionário'
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (emp) => {
  empToDelete.value = emp
  showDeleteModal.value = true
}

const deleteEmployee = async () => {
  deleting.value = true
  try {
    await authenticatedFetch(`/api/dashboard/employees/${empToDelete.value._id}`, { method: 'DELETE' })
    employees.value = employees.value.filter(e => e._id !== empToDelete.value._id)
    showToast('Funcionário removido com sucesso!')
    showDeleteModal.value = false
    empToDelete.value = null
  } catch {
    showToast('Erro ao remover funcionário', 'error')
  } finally {
    deleting.value = false
  }
}

const closeModal = () => {
  showCreateModal.value = false
  form.value = { name: '', email: '', password: '' }
  formError.value = ''
  showPwd.value = false
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(loadEmployees)
</script>

<style scoped>
.employees-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-left h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.page-description {
  color: #6b7280;
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.75rem;
  color: #1e40af;
}

.info-card svg { flex-shrink: 0; margin-top: 2px; }
.info-card strong { display: block; font-weight: 600; margin-bottom: 0.25rem; }
.info-card p { margin: 0; font-size: 0.875rem; line-height: 1.5; }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #6b7280;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #ff8e24;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem 2rem;
  color: #9ca3af;
  text-align: center;
}

.empty-state svg { color: #d1d5db; }
.empty-state h3 { margin: 0; font-size: 1.25rem; color: #374151; }
.empty-state p { margin: 0 0 1rem; }

.employees-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.employee-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  padding: 1.125rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.emp-avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.emp-info {
  flex: 1;
  min-width: 0;
}

.emp-info h3 {
  margin: 0 0 0.125rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.emp-info p {
  margin: 0 0 0.125rem;
  font-size: 0.875rem;
  color: #64748b;
}

.emp-since {
  font-size: 0.75rem;
  color: #94a3b8;
}

.emp-badge {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.btn-delete {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: white;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
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
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.close-btn:hover { background: #f3f4f6; }

.modal-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #ff8e24;
  box-shadow: 0 0 0 3px rgba(255,142,36,0.1);
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  padding-right: 3rem;
  box-sizing: border-box;
}

.toggle-pwd {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
}

.access-summary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
}

.access-summary h4 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.access-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.access-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
}

.access-item.allowed {
  background: #d1fae5;
  color: #065f46;
}

.access-item.denied {
  background: #fee2e2;
  color: #991b1b;
}

.form-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 0;
  padding: 0.625rem 0.875rem;
  background: #fee2e2;
  border-radius: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ff8e24;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) { background: #e67e22; }
.btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) { background: #f9fafb; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Delete modal */
.delete-modal {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.delete-icon {
  width: 4rem;
  height: 4rem;
  background: #fef2f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
}

.delete-modal h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.delete-modal p {
  margin: 0;
  color: #374151;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.warn-text { color: #9ca3af; font-size: 0.875rem; }

.delete-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  width: 100%;
}

.delete-actions .btn-secondary { flex: 1; }

.btn-delete-confirm {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-confirm:hover:not(:disabled) { background: #dc2626; }
.btn-delete-confirm:disabled { background: #9ca3af; cursor: not-allowed; }

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  font-size: 0.9375rem;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.toast.success { background: #10b981; }
.toast.error { background: #ef4444; }
</style>
