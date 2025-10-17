<!-- pages/login.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <div v-if="loadingSettings" class="skeleton-logo"></div>
        <img v-else :src="storeSettings.logo || '/logo.jpg'" :alt="storeSettings.storeName" class="logo" />
        
        <div v-if="loadingSettings" class="skeleton-title"></div>
        <h1 v-else>{{ storeSettings.storeName || 'Queiroz Hamburgueria' }}</h1>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="seu@email.com"
            autocomplete="email"
          />
        </div>
         <div class="form-group">
           <label for="password">Senha</label>
           <div class="password-input-wrapper">
             <input
               id="password"
               v-model="form.password"
               :type="showPassword ? 'text' : 'password'"
               required
               placeholder="Digite sua senha"
               autocomplete="current-password"
             />
             <button 
               type="button" 
               @click="showPassword = !showPassword" 
               class="toggle-password"
               :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
             >
               <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                 <circle cx="12" cy="12" r="3"></circle>
               </svg>
               <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                 <line x1="1" y1="1" x2="23" y2="23"></line>
               </svg>
             </button>
           </div>
         </div>
        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? "Entrando..." : "Entrar" }}
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
      <!-- <p class="register-link">
        Não tem conta? <NuxtLink to="/register">Cadastre-se</NuxtLink>
      </p> -->
    </div>
  </div>
</template>

<script setup>
const router = useRouter();
const form = ref({
  email: "",
  password: "",
});
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);
const loadingSettings = ref(true);

// Buscar configurações da loja
const storeSettings = ref({
  storeName: '',
  logo: ''
});

const loadStoreSettings = async () => {
  try {
    const data = await $fetch('/api/settings');
    storeSettings.value = {
      storeName: data.storeName || 'Queiroz Hamburgueria',
      logo: data.logo || '/logo.jpg'
    };
  } catch (err) {
    console.error('Erro ao carregar configurações:', err);
    // Usar valores padrão em caso de erro
    storeSettings.value = {
      storeName: 'Queiroz Hamburgueria',
      logo: '/logo.jpg'
    };
  } finally {
    loadingSettings.value = false;
  }
};

// Verificar se já está autenticado
const checkAuth = async () => {
  try {
    // Preparar headers com token do localStorage como fallback
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
    
    // Tentar obter token do localStorage como fallback
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('🔑 Usando token do localStorage para verificação')
    }
    
    await $fetch(`/api/auth/me?t=${Date.now()}`, {
      credentials: 'include',
      headers
    });
    await router.push('/dashboard');
  } catch (err) {
    console.log('Não autenticado, permanecendo no login');
  }
};

// Carregar ao montar o componente
onMounted(() => {
  if (process.client) {
    if (sessionStorage.getItem('justLoggedOut') === 'true') {
      sessionStorage.removeItem('justLoggedOut');
      console.log('Pulado verificação de auth devido a logout recente');
    } else {
      checkAuth();
    }
  }
  loadStoreSettings();
});
 
const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    error.value = "Preencha email e senha";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    // Fazer login - o cookie será salvo automaticamente pelo servidor
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: form.value,
      credentials: 'include' // Importante para cookies
    });
    
    if (process.client) {
      sessionStorage.removeItem('justLoggedOut');
    }
    
    console.log('✅ Login realizado com sucesso!');
    
    // Armazenar token no localStorage como fallback
    if (response.token && process.client) {
      localStorage.setItem('auth_token', response.token);
      console.log('🔑 Token armazenado no localStorage como fallback');
    }
    
    // Pequeno delay para garantir que o cookie seja propagado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Redirecionar para dashboard
    await router.push("/dashboard");
  } catch (err) {
    console.error("❌ Erro no login:", err);
    error.value = err.data?.statusMessage || err.statusMessage || "Erro ao fazer login";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  padding: var(--spacing-lg);
}

.login-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo-section {
  margin-bottom: var(--spacing-2xl);
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-lg);
}

/* Skeleton Loaders */
.skeleton-logo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin: 0 auto var(--spacing-lg);
}

.skeleton-title {
  width: 200px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin: 0 auto;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.logo-section h1 {
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.form-group label {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.form-group input {
  background-color: transparent;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  color: #3f3f3f;
  font-family: var(--font-family);
  font-size: 1rem;
  font-weight: 600;
  padding: 1.25rem 1rem;
  transition: border 0.25s ease-in-out;
  width: 100%;
}

@media (max-width: 768px) {
  .form-group input {
    font-size: 0.9rem;
    padding: 1rem 0.75rem;
  }
}

/* Wrapper do input de password com botão */
.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  flex: 1;
  padding-right: 3rem;
  color: #3f3f3f;
  font-family: var(--font-family);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1.5;
}

.password-input-wrapper input[type="password"] {
  font-family: 'Verdana', sans-serif;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.125em;
  line-height: 1.5;
  -webkit-text-security: disc;
}

.password-input-wrapper input[type="password"]::placeholder {
  font-family: var(--font-family);
  font-weight: 600;
  letter-spacing: normal;
}

@media (max-width: 768px) {
  .password-input-wrapper input {
    font-size: 0.9rem;
    padding-right: 2.5rem;
  }
  
  .password-input-wrapper input[type="password"] {
    font-size: 0.9rem;
  }
}

/* Botão de toggle password */
.toggle-password {
  position: absolute;
  right: var(--spacing-md);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.toggle-password:hover {
  color: var(--color-primary);
}

.toggle-password svg {
  display: block;
}

.login-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-base);
}

.login-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin: 0;
}

.register-link {
  margin: var(--spacing-lg) 0 0;
  color: var(--color-text-secondary);
}

.register-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: var(--spacing-xl);
  }
}
</style>