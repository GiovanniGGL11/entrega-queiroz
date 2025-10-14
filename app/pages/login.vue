<!-- pages/login.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <img src="/logo.jpg" alt="Queiroz Hamburgueria" class="logo" />
        <h1>Queiroz Hamburgueria</h1>
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
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>
        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? "Entrando..." : "Entrar" }}
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
      <p class="register-link">
        Não tem conta? <NuxtLink to="/register">Cadastre-se</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import axios from "axios"; // Import Axios
const router = useRouter();
const form = ref({
  email: "",
  password: "",
});
const loading = ref(false);
const error = ref("");

const handleLogin = async () => {
  console.log("🔥 handleLogin chamado! Form:", form.value); // Log de debug (remova depois)
  if (!form.value.email || !form.value.password) {
    error.value = "Preencha email e senha";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    console.log("📡 Chamando API login..."); // Log de debug
    const { data } = await axios.post("/api/auth/login", form.value);
    console.log("✅ API login OK! Data:", data); // Log de debug
    const { token } = data;
    console.log("🍪 Setando token..."); // Log de debug
    await axios.post("/api/auth/set-token", { token });
    console.log("🚀 Redirecionando para dashboard..."); // Log de debug
    await router.push("/dashboard");
  } catch (err) {
    console.error("❌ Erro completo:", err); // Log de debug
    // Axios errors: data pode estar em err.response.data
    error.value =
      err.response?.data?.message || err.message || "Erro ao fazer login";
  } finally {
    loading.value = false;
    console.log("🏁 Loading finalizado"); // Log de debug
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff8e24, #e67e22);
  padding: 1rem;
}

.login-card {
  background: #fff;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo-section {
  margin-bottom: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.logo-section h1 {
  color: #323232;
  font-size: 1.5rem;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.form-group label {
  font-weight: 500;
  color: #323232;
  margin-bottom: 0.5rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #efefef;
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
}

.form-group input:focus {
  border-color: #ff8e24;
}

.login-btn {
  background: #ff8e24;
  color: #fff;
  border: none;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover:not(:disabled) {
  background: #e67e22;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  margin: 0;
}

.register-link {
  margin: 1rem 0 0;
  color: #666;
}

.register-link a {
  color: #ff8e24;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
}
</style>
