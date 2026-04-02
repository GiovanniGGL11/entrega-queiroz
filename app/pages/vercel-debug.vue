<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">🔍 Debug Vercel</h1>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
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
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Teste Vercel Debug</h2>
        <button 
          @click="testVercelDebug"
          :disabled="loading"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ loading ? 'Testando...' : 'Testar /api/vercel-debug' }}
        </button>
        <div v-if="result" class="mt-4 p-4 bg-gray-100 rounded">
          <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const token = ref('')
const tokenStatus = ref(false)
const loading = ref(false)
const result = ref(null)

onMounted(() => {
  if (process.client) {
    token.value = localStorage.getItem('auth_token') || ''
    tokenStatus.value = !!token.value
  }
})

const testVercelDebug = async () => {
  loading.value = true
  
  const headers = {}
  if (process.client && token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }
  
  try {
    const response = await $fetch('/api/vercel-debug', {
      headers,
      credentials: 'include'
    })
    result.value = { success: true, data: response }
  } catch (error) {
    result.value = { 
      success: false, 
      error: {
        status: error.status,
        statusMessage: error.statusMessage,
        message: error.message
      }
    }
  }
  
  loading.value = false
}
</script>
