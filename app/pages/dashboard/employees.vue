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
        <strong>Permissões por Funcionário</strong>
        <p>Cada funcionário pode ter um conjunto de permissões diferente. Clique em <strong>Permissões</strong> no card do funcionário para personalizar o acesso.</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando...</p>
    </div>

    <!-- Erro ao carregar -->
    <div v-else-if="loadError" class="error-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ loadError }}</p>
      <button @click="loadEmployees" class="btn-primary" style="margin-top:0.5rem">Tentar novamente</button>
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
        <div class="emp-avatar-wrap">
          <img v-if="emp.photo" :src="emp.photo" class="emp-avatar emp-avatar-img" :alt="emp.name" />
          <div v-else class="emp-avatar">{{ (emp.name || emp.email).charAt(0).toUpperCase() }}</div>
          <label class="emp-photo-btn" :title="'Alterar foto de ' + emp.name">
            <input type="file" accept="image/*" style="display:none" @change="uploadEmpPhoto($event, emp)" :disabled="uploadingPhotoId === emp._id" />
            <svg v-if="uploadingPhotoId !== emp._id" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>
          </label>
        </div>
        <div class="emp-info">
          <h3>{{ emp.name || '—' }}</h3>
          <p>{{ emp.email }}</p>
          <span class="emp-since">Desde {{ formatDate(emp.createdAt) }}</span>
          <!-- Tags de permissões -->
          <div class="perm-tags">
            <span v-for="p in ALL_PERMISSIONS" :key="p.key"
              :class="['perm-tag', emp.permissions?.includes(p.key) ? 'perm-on' : 'perm-off']">
              {{ p.label }}
            </span>
          </div>
        </div>
        <div class="emp-actions">
          <button @click="openPermissionsModal(emp)" class="btn-perms">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Permissões
          </button>
          <button @click="confirmDelete(emp)" class="btn-delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
            </svg>
            Remover
          </button>
        </div>
      </div>
    </div>

    <!-- Modal criar funcionário -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Novo Funcionário</h2>
          <button @click="closeModal" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form @submit.prevent="createEmployee" class="modal-form">
          <!-- Foto de perfil -->
          <div class="photo-upload-section">
            <div class="photo-preview-wrap">
              <img v-if="form.photo" :src="form.photo" class="photo-preview-img" />
              <div v-else class="photo-preview-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>
            <div class="photo-upload-info">
              <label class="btn-upload-photo">
                <input type="file" accept="image/*" style="display:none" @change="handleFormPhotoUpload" :disabled="uploadingFormPhoto" />
                <svg v-if="!uploadingFormPhoto" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {{ uploadingFormPhoto ? 'Carregando...' : (form.photo ? 'Trocar foto' : 'Adicionar foto') }}
              </label>
              <span class="photo-hint">Opcional · JPG ou PNG · máx. 2MB</span>
            </div>
          </div>

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

          <!-- Permissões ao criar -->
          <div class="access-summary">
            <h4>Permissões de acesso</h4>
            <p class="perm-hint">Você poderá ajustar as permissões individualmente após criar o funcionário.</p>
            <div class="perm-checkboxes">
              <label v-for="p in ALL_PERMISSIONS" :key="p.key" class="perm-checkbox-label">
                <input type="checkbox" v-model="form.permissions" :value="p.key" />
                <span>{{ p.label }}</span>
              </label>
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

    <!-- Modal permissões -->
    <div v-if="showPermModal" class="modal-overlay" @click.self="showPermModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Permissões — {{ permTarget?.name || permTarget?.email }}</h2>
          <button @click="showPermModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-form">
          <p style="margin:0; color:#64748b; font-size:0.875rem;">Selecione quais seções este funcionário pode acessar:</p>

          <div class="perm-list">
            <label v-for="p in ALL_PERMISSIONS" :key="p.key" class="perm-row">
              <div class="perm-row-info">
                <span class="perm-row-label">{{ p.label }}</span>
                <span class="perm-row-desc">{{ p.desc }}</span>
              </div>
              <div class="toggle-switch">
                <input type="checkbox" v-model="editPerms" :value="p.key" :id="'perm-' + p.key" />
                <label :for="'perm-' + p.key" class="toggle-slider-label"></label>
              </div>
            </label>
          </div>

          <div class="form-actions">
            <button @click="showPermModal = false" class="btn-secondary" :disabled="savingPerms">Cancelar</button>
            <button @click="savePermissions" class="btn-primary" :disabled="savingPerms">
              {{ savingPerms ? 'Salvando...' : 'Salvar Permissões' }}
            </button>
          </div>
        </div>
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

const router = useRouter()
const { authenticatedFetch } = useAuthenticatedFetch()
const { userRole, loadUserRole } = useUserRole()


const ALL_PERMISSIONS = [
  { key: 'orders',     label: 'Pedidos',      desc: 'Ver e gerenciar pedidos' },
  { key: 'pdv',        label: 'PDV / Balcão', desc: 'Usar o ponto de venda' },
  { key: 'motoboys',   label: 'Motoboys',     desc: 'Ver e gerenciar motoboys' },
  { key: 'inventory',  label: 'Estoque',      desc: 'Controlar estoque de produtos' },
  { key: 'customers',  label: 'Clientes',     desc: 'Ver histórico de clientes' },
  { key: 'coupons',    label: 'Cupons',       desc: 'Criar e gerenciar cupons' },
  { key: 'products',   label: 'Produtos',     desc: 'Editar produtos do cardápio' },
  { key: 'categories', label: 'Categorias',   desc: 'Editar categorias do cardápio' },
]

const DEFAULT_PERMISSIONS = ALL_PERMISSIONS.map(p => p.key)

const loading = ref(true)
const uploadingPhotoId = ref(null)   // id do funcionário cujo upload está em andamento
const uploadingFormPhoto = ref(false) // upload no modal de criação
const employees = ref([])
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const showPermModal = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const savingPerms = ref(false)
const showPwd = ref(false)
const empToDelete = ref(null)
const permTarget = ref(null)
const editPerms = ref([...DEFAULT_PERMISSIONS])
const formError = ref('')

const form = ref({ name: '', email: '', password: '', permissions: [...DEFAULT_PERMISSIONS], photo: '' })

const toast = ref({ show: false, type: 'success', message: '' })

const showToast = (msg, type = 'success') => {
  toast.value = { show: true, type, message: msg }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const loadError = ref('')

const loadEmployees = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const data = await authenticatedFetch('/api/dashboard/employees', { noCache: true })
    employees.value = Array.isArray(data) ? data : []
  } catch (err) {
    loadError.value = err?.data?.message || err?.message || 'Erro ao carregar funcionários'
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
      body: { name: form.value.name, email: form.value.email, password: form.value.password, permissions: form.value.permissions, photo: form.value.photo || null }
    })
    employees.value.push({ ...res.employee, permissions: form.value.permissions, photo: form.value.photo || null })
    showToast('Funcionário criado com sucesso!')
    closeModal()
  } catch (err) {
    formError.value = err.data?.message || 'Erro ao criar funcionário'
  } finally {
    submitting.value = false
  }
}

const openPermissionsModal = (emp) => {
  permTarget.value = emp
  editPerms.value = [...(emp.permissions ?? DEFAULT_PERMISSIONS)]
  showPermModal.value = true
}

const savePermissions = async () => {
  savingPerms.value = true
  try {
    await authenticatedFetch(`/api/dashboard/employees/${permTarget.value._id}`, {
      method: 'PUT',
      body: { permissions: editPerms.value }
    })
    // Atualizar localmente
    const idx = employees.value.findIndex(e => e._id === permTarget.value._id)
    if (idx !== -1) employees.value[idx].permissions = [...editPerms.value]
    showToast('Permissões atualizadas!')
    showPermModal.value = false
  } catch {
    showToast('Erro ao salvar permissões', 'error')
  } finally {
    savingPerms.value = false
  }
}

const confirmDelete = (emp) => {
  empToDelete.value = emp
  showDeleteModal.value = true
}

const deleteEmployee = async () => {
  if (!empToDelete.value?._id) return
  deleting.value = true
  const id = empToDelete.value._id
  try {
    await authenticatedFetch(`/api/dashboard/employees/${id}`, { method: 'DELETE' })
    employees.value = employees.value.filter(e => e._id !== id)
    showToast('Funcionário removido com sucesso!')
    showDeleteModal.value = false
    empToDelete.value = null
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Erro ao remover funcionário'
    showToast(msg, 'error')
  } finally {
    deleting.value = false
  }
}

// Comprime e redimensiona imagem para base64 (max 300x300, qualidade 0.8)
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('Imagem muito grande. Máximo 2MB.'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 300
        let w = img.width, h = img.height
        if (w > h) { if (w > max) { h = (h * max) / w; w = max } }
        else { if (h > max) { w = (w * max) / h; h = max } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Upload de foto no modal de criação
const handleFormPhotoUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  uploadingFormPhoto.value = true
  try {
    form.value.photo = await compressImage(file)
  } catch (err) {
    showToast(err.message || 'Erro ao carregar imagem', 'error')
  } finally {
    uploadingFormPhoto.value = false
    event.target.value = ''
  }
}

// Upload de foto diretamente no card do funcionário
const uploadEmpPhoto = async (event, emp) => {
  const file = event.target.files[0]
  if (!file) return
  uploadingPhotoId.value = emp._id
  try {
    const photo = await compressImage(file)
    await authenticatedFetch(`/api/dashboard/employees/${emp._id}`, {
      method: 'PUT',
      body: { photo }
    })
    const idx = employees.value.findIndex(e => e._id === emp._id)
    if (idx !== -1) employees.value[idx].photo = photo
    showToast('Foto atualizada!')
  } catch (err) {
    showToast(err.message || 'Erro ao atualizar foto', 'error')
  } finally {
    uploadingPhotoId.value = null
    event.target.value = ''
  }
}

const closeModal = () => {
  showCreateModal.value = false
  form.value = { name: '', email: '', password: '', permissions: [...DEFAULT_PERMISSIONS], photo: '' }
  formError.value = ''
  showPwd.value = false
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => {
  loadUserRole()
  if (userRole.value === 'employee') {
    router.replace('/dashboard/orders')
    return
  }
  loadEmployees()
})
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

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 2rem;
  color: #ef4444;
  text-align: center;
}

.error-state p { margin: 0; font-size: 0.9375rem; }

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
  align-items: flex-start;
  gap: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  padding: 1.125rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.emp-avatar-wrap {
  position: relative;
  flex-shrink: 0;
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
}

.emp-avatar-img {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  object-fit: cover;
  background: #e2e8f0;
}

.emp-photo-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid white;
  transition: background 0.2s;
}

.emp-photo-btn:hover { background: #4f46e5; }

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

.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.perm-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.perm-on {
  background: #dcfce7;
  color: #166534;
}

.perm-off {
  background: #f1f5f9;
  color: #94a3b8;
  text-decoration: line-through;
}

.emp-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-perms {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: white;
  color: #6366f1;
  border: 1px solid #6366f1;
  border-radius: 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-perms:hover {
  background: #6366f1;
  color: white;
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
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
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
  font-size: 1.125rem;
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

.password-wrapper { position: relative; }
.password-wrapper input { width: 100%; padding-right: 3rem; box-sizing: border-box; }

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

/* Permissões no modal criar */
/* Foto no modal criar */
.photo-upload-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.photo-preview-wrap {
  flex-shrink: 0;
}

.photo-preview-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.photo-preview-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.photo-upload-info {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.btn-upload-photo {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: white;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-upload-photo:hover { background: #4f46e5; }

.photo-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

.access-summary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
}

.access-summary h4 {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.perm-hint {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.perm-checkboxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.perm-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  transition: all 0.15s;
}

.perm-checkbox-label:hover { border-color: #6366f1; background: #eef2ff; }
.perm-checkbox-label input { accent-color: #6366f1; width: 1rem; height: 1rem; }

/* Lista de permissões no modal editar */
.perm-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.perm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s;
}

.perm-row:hover { border-color: #6366f1; }

.perm-row-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.perm-row-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
}

.perm-row-desc {
  font-size: 0.8125rem;
  color: #64748b;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-slider-label {
  display: block;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.toggle-slider-label::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-switch input:checked + .toggle-slider-label {
  background: #6366f1;
}

.toggle-switch input:checked + .toggle-slider-label::after {
  transform: translateX(20px);
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

.delete-modal h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
.delete-modal p { margin: 0; color: #374151; font-size: 0.9375rem; line-height: 1.5; }
.warn-text { color: #9ca3af; font-size: 0.875rem; }

.delete-actions { display: flex; gap: 0.75rem; }

.btn-delete-confirm {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-delete-confirm:hover:not(:disabled) { background: #dc2626; }
.btn-delete-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.9375rem;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.toast.success { background: #16a34a; color: white; }
.toast.error { background: #ef4444; color: white; }
</style>
