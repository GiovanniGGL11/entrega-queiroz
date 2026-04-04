<template>
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Identificando...</p>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const token = route.query.token
  if (token) {
    const decoded = decodeURIComponent(token)
    localStorage.setItem('customer_token', decoded)

    // Buscar dados do cliente
    try {
      const data = await $fetch('/api/customers/me', {
        headers: { Authorization: `Bearer ${decoded}` }
      })
      localStorage.setItem('customer_data', JSON.stringify(data))
    } catch (e) {}

    router.push('/?after_google=1')
  } else {
    router.push('/')
  }
})
</script>

<style scoped>
.loading-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  font-size: 1.1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
