<template>
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Entrando com Google...</p>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

onMounted(() => {
  const token = route.query.token
  if (token) {
    localStorage.setItem('auth_token', token)
    router.push('/dashboard')
  } else {
    router.push('/login?error=falha_google')
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
