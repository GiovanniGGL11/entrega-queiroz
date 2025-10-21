<!-- pages/dashboard/menu.vue -->
<template>
  <div class="dashboard">
    <aside class="admin-sidebar">
      <!-- Mesma sidebar do dashboard.vue -->
      <div class="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li>
            <NuxtLink to="/dashboard" class="nav-link">Dashboard</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/menu" class="nav-link active"
              >Gerenciar Menu</NuxtLink
            >
          </li>
          <li>
            <NuxtLink to="/dashboard/orders" class="nav-link">Pedidos</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/stats" class="nav-link"
              >Estatísticas</NuxtLink
            >
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">Sair</button>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="dashboard-header">
        <h1>Gerenciar Menu</h1>
        <button @click="toggleAdminSidebar" class="mobile-menu-btn">☰</button>
      </header>
      <main class="dashboard-content">
        <!-- Tabs para Categorias e Produtos -->
        <div class="tabs">
          <button class="tab active" @click="activeTab = 'categories'">
            Categorias
          </button>
          <button class="tab" @click="activeTab = 'products'">Produtos</button>
        </div>

        <!-- Form Categoria -->
        <div v-if="activeTab === 'categories'" class="form-section">
          <h2>Criar Nova Categoria</h2>
          <form @submit.prevent="createCategory" class="form">
            <div class="form-group">
              <label for="category-name">Nome</label>
              <input
                id="category-name"
                v-model="newCategory.name"
                type="text"
                required
                placeholder="Ex: Hamburger Artesanal"
              />
            </div>
            <button type="submit" :disabled="loading" class="submit-btn">
              Criar Categoria
            </button>
          </form>
          <div class="list">
            <h3>Categorias Existentes</h3>
            <ul>
              <li v-for="cat in categories" :key="cat.id" class="list-item">
                {{ cat.name }}
                <button @click="deleteCategory(cat.id)" class="delete-btn">
                  Excluir
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Form Produto -->
        <div v-if="activeTab === 'products'" class="form-section">
          <h2>Criar Novo Produto</h2>
          <form
            @submit.prevent="createProduct"
            class="form"
            enctype="multipart/form-data"
          >
            <div class="form-group">
              <label for="product-name">Nome</label>
              <input
                id="product-name"
                v-model="newProduct.name"
                type="text"
                required
                placeholder="Ex: Americano"
              />
            </div>
            <div class="form-group">
              <label for="product-description">Descrição</label>
              <textarea
                id="product-description"
                v-model="newProduct.description"
                required
                placeholder="Descrição do produto"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="product-price">Preço (R$)</label>
              <input
                id="product-price"
                v-model="newProduct.price"
                type="number"
                step="0.01"
                required
                placeholder="28.00"
              />
            </div>
            <div class="form-group">
              <label for="product-category">Categoria</label>
              <select
                id="product-category"
                v-model="newProduct.categoryId"
                required
              >
                <option value="">Selecione uma categoria</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="product-image">Imagem</label>
              <input
                id="product-image"
                ref="imageInput"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                required
              />
              <img
                v-if="newProduct.imagePreview"
                :src="newProduct.imagePreview"
                alt="Preview"
                class="image-preview"
              />
            </div>
            <button type="submit" :disabled="loading" class="submit-btn">
              Criar Produto
            </button>
          </form>
          <div class="list">
            <h3>Produtos Existentes</h3>
            <ul>
              <li v-for="prod in products" :key="prod.id" class="list-item">
                <div>
                  <img
                    :src="prod.image"
                    :alt="prod.name"
                    class="product-thumb"
                  />
                  <strong>{{ prod.name }}</strong> -
                  {{ prod.description.substring(0, 50) }}... (R$
                  {{ prod.price }})
                </div>
                <button @click="deleteProduct(prod.id)" class="delete-btn">
                  Excluir
                </button>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref, onMounted } from "vue";

const router = useRouter();
const activeTab = ref("categories");
const loading = ref(false);
const categories = ref([]);
const products = ref([]);

const newCategory = ref({ name: "" });
const newProduct = ref({
  name: "",
  description: "",
  price: "",
  categoryId: "",
  image: null,
  imagePreview: "",
});

const imageInput = ref(null);

const toggleAdminSidebar = () => {
  const sidebar = document.querySelector(".admin-sidebar");
  sidebar.classList.toggle("open");
};

const handleLogout = async () => {
  try {
    await axios.post("/api/auth/logout");
  } catch (err) {
    console.error("Erro no logout:", err);
  } finally {
    await router.push("/login");
  }
};

const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      newProduct.value.imagePreview = ev.target.result;
    };
    reader.readAsDataURL(file);
    newProduct.value.image = file;
  }
};

const createCategory = async () => {
  loading.value = true;
  try {
    await axios.post("/api/categories", newCategory.value);
    newCategory.value.name = "";
    await loadCategories();
  } catch (err) {
    alert(err.response?.data?.message || "Erro ao criar categoria");
  } finally {
    loading.value = false;
  }
};

const deleteCategory = async (id) => {
  if (confirm("Excluir categoria?")) {
    try {
      await axios.delete(`/api/categories/${id}`);
      await loadCategories();
    } catch (err) {
      alert("Erro ao excluir categoria");
    }
  }
};

const createProduct = async () => {
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("name", newProduct.value.name);
    formData.append("description", newProduct.value.description);
    formData.append("price", newProduct.value.price);
    formData.append("categoryId", newProduct.value.categoryId);
    if (newProduct.value.image) {
      formData.append("image", newProduct.value.image);
    }

    await axios.post("/api/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    newProduct.value = {
      name: "",
      description: "",
      price: "",
      categoryId: "",
      image: null,
      imagePreview: "",
    };
    imageInput.value.value = "";
    await loadProducts();
  } catch (err) {
    alert(err.response?.data?.message || "Erro ao criar produto");
  } finally {
    loading.value = false;
  }
};

const deleteProduct = async (id) => {
  if (confirm("Excluir produto?")) {
    try {
      await axios.delete(`/api/products/${id}`);
      await loadProducts();
    } catch (err) {
      alert("Erro ao excluir produto");
    }
  }
};

const loadCategories = async () => {
  try {
    const { data } = await axios.get("/api/categories");
    categories.value = data;
  } catch (err) {
    console.error("Erro ao carregar categorias");
  }
};

const loadProducts = async () => {
  try {
    const { data } = await axios.get("/api/products");
    products.value = data;
  } catch (err) {
    console.error("Erro ao carregar produtos");
  }
};

onMounted(() => {
  loadCategories();
  loadProducts();
});
</script>

<style scoped>
/* Reutilize os estilos da sidebar e header de dashboard.vue */
.form-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.form-section h2 {
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.form {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  padding-right: calc(0.75rem + 1.5rem); /* Espaço extra para a setinha */
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  appearance: none;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #ff8e24;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.image-preview {
  max-width: 200px;
  max-height: 150px;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

.submit-btn {
  background: #ff8e24;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #f59e0b;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.list h3 {
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.list ul {
  list-style: none;
  padding: 0;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  background: #f9fafb;
}

.product-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 0.25rem;
  margin-right: 1rem;
}

.delete-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.delete-btn:hover {
  background: #dc2626;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.tab {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: #ff8e24;
  border-bottom-color: #ff8e24;
  font-weight: 500;
}

.tab:hover {
  color: #ff8e24;
}

/* Responsivo */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }

  .main-wrapper {
    margin-left: 0;
    width: 100%;
  }

  .mobile-menu-btn {
    display: block;
  }

  .dashboard-content {
    padding: 1rem;
  }

  .list-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .tabs {
    overflow-x: auto;
  }
}
</style>
