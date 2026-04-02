<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">🔍 Debug de Autenticação</h1>
      
      <div class="grid gap-6">
        <!-- Status do Token -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Status do Token</h2>
          <div class="space-y-2">
            <p><strong>Token no localStorage:</strong> 
              <span :class="tokenStatus ? 'text-green-600' : 'text-red-600'">
                {{ tokenStatus ? 'Presente' : 'Ausente' }}
              </span>
            </p>
            <p v-if="tokenStatus"><strong>Token:</strong> {{ token.substring(0, 20) }}...</p>
          </div>
        </div>
        
        <!-- Teste 1: Endpoint Básico -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Teste 1: Endpoint Básico</h2>
          <button 
            @click="testBasicEndpoint"
            :disabled="loading.basic"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {{ loading.basic ? 'Testando...' : 'Testar /api/test-auth' }}
          </button>
          <div v-if="results.basic" class="mt-4 p-4 bg-gray-100 rounded">
            <pre>{{ JSON.stringify(results.basic, null, 2) }}</pre>
          </div>
        </div>
        
        <!-- Teste 2: Endpoint Dashboard -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Teste 2: Endpoint Dashboard</h2>
          <button 
            @click="testDashboardEndpoint"
            :disabled="loading.dashboard"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {{ loading.dashboard ? 'Testando...' : 'Testar /api/test-dashboard' }}
          </button>
          <div v-if="results.dashboard" class="mt-4 p-4 bg-gray-100 rounded">
            <pre>{{ JSON.stringify(results.dashboard, null, 2) }}</pre>
          </div>
        </div>
        
        <!-- Teste 3: Autenticação Manual -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Teste 3: Autenticação Manual</h2>
          <button 
            @click="testManualAuth"
            :disabled="loading.manual"
            class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {{ loading.manual ? 'Testando...' : 'Testar /api/manual-auth' }}
          </button>
          <div v-if="results.manual" class="mt-4 p-4 bg-gray-100 rounded">
            <pre>{{ JSON.stringify(results.manual, null, 2) }}</pre>
          </div>
        </div>
        
        <!-- Teste 4: Endpoint Real Dashboard -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Teste 4: Endpoint Real Dashboard</h2>
          <button 
            @click="testRealDashboard"
            :disabled="loading.real"
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            {{ loading.real ? 'Testando...' : 'Testar /api/dashboard/stats' }}
          </button>
          <div v-if="results.real" class="mt-4 p-4 bg-gray-100 rounded">
            <pre>{{ JSON.stringify(results.real, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const token = ref('')
const tokenStatus = ref(false)
const loading = ref({
  basic: false,
  dashboard: false,
  manual: false,
  real: false
})
const results = ref({
  basic: null,
  dashboard: null,
  manual: null,
  real: null
})

onMounted(() => {
  if (process.client) {
    token.value = localStorage.getItem('auth_token') || ''
    tokenStatus.value = !!token.value
  }
})

const makeRequest = async (url, testName) => {
  const headers = {}
  
  if (process.client && token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }
  
  try {
    const response = await $fetch(url, {
      headers,
      credentials: 'include'
    })
    return { success: true, data: response }
  } catch (error) {
    return { 
      success: false, 
      error: {
        status: error.status,
        statusMessage: error.statusMessage,
        message: error.message
      }
    }
  }
}

const testBasicEndpoint = async () => {
  loading.value.basic = true
  results.value.basic = await makeRequest('/api/test-auth', 'basic')
  loading.value.basic = false
}

const testDashboardEndpoint = async () => {
  loading.value.dashboard = true
  results.value.dashboard = await makeRequest('/api/test-dashboard', 'dashboard')
  loading.value.dashboard = false
}

const testManualAuth = async () => {
  loading.value.manual = true
  results.value.manual = await makeRequest('/api/manual-auth', 'manual')
  loading.value.manual = false
}

const testRealDashboard = async () => {
  loading.value.real = true
  results.value.real = await makeRequest('/api/dashboard/stats', 'real')
  loading.value.real = false
}
</script>
