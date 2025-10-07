<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from "vue";

const selectedItem = ref(null);
const selectedCategory = ref("artesanal");
const searchQuery = ref("");

const categories = ref([
  {
    id: "artesanal",
    name: "Hamburger Artesanal",
    items: [
      {
        id: 1,
        name: "Americano",
        description:
          "Pão de brioche, 150g de carne, queijo prato fatiado, alface americano, cebola roxa, tomate e maionese da casa",
        price: "R$ 28,00",
        image:
          "https://imagedelivery.net/KWx2kLZVCnquS_91k5JjHA/29c11710-9052-4526-9838-92d7f05ca0ec/689d0e68e8158.jpg/small",
      },
      {
        id: 2,
        name: "Americano",
        description:
          "Pão de brioche, 150g de carne, queijo prato fatiado, alface americano, cebola roxa, tomate e maionese da casa",
        price: "R$ 28,00",
        image:
          "https://imagedelivery.net/KWx2kLZVCnquS_91k5JjHA/29c11710-9052-4526-9838-92d7f05ca0ec/689d0e68e8158.jpg/small",
      },
      {
        id: 3,
        name: "Americano",
        description:
          "Pão de brioche, 150g de carne, queijo prato fatiado, alface americano, cebola roxa, tomate e maionese da casa",
        price: "R$ 28,00",
        image:
          "https://imagedelivery.net/KWx2kLZVCnquS_91k5JjHA/29c11710-9052-4526-9838-92d7f05ca0ec/689d0e68e8158.jpg/small",
      },
    ],
  },
  {
    id: "acompanhamento",
    name: "Acompanhamento",
    items: [
      {
        id: 4,
        name: "Batata",
        description: "150g de batata frita",
        price: "R$ 12,00",
        image:
          "https://imagedelivery.net/KWx2kLZVCnquS_91k5JjHA/29c11710-9052-4526-9838-92d7f05ca0ec/6894114d6f833.jpg/small",
      },
    ],
  },
  {
    id: "bebidas",
    name: "Bebidas",
    items: [
      {
        id: 4,
        name: "Suco",
        description: "150g de batata frita",
        price: "R$ 12,00",
        image: "/not_found.jpg",
      },
    ],
  },
  {
    id: "molho",
    name: "Molho Extra",
    items: [
      {
        id: 4,
        name: "Suco",
        description: "150g de batata frita",
        price: "R$ 12,00",
        image: "/not_found.jpg",
      },
    ],
  },
]);

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return categories.value;
  }
  const query = searchQuery.value.toLowerCase().trim();
  return categories.value
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      ),
    }))
    .filter((cat) => cat.items.length > 0);
});

let observer = null;

const setupObserver = () => {
  if (observer) {
    observer.disconnect();
  }
  observer = new IntersectionObserver(
    (entries) => {
      let maxRatio = 0;
      let activeId = selectedCategory.value; // fallback
      entries.forEach((entry) => {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          activeId = entry.target.id.replace("category-", "");
        }
      });
      if (maxRatio > 0.1) {
        // small threshold to avoid flickering
        selectedCategory.value = activeId;
      }
    },
    {
      threshold: [0, 0.1, 0.5, 1],
      rootMargin: "-10% 0px -70% 0px",
    }
  );

  filteredCategories.value.forEach((cat) => {
    const el = document.getElementById(`category-${cat.id}`);
    if (el) {
      observer.observe(el);
    }
  });
};

const scrollToCategory = async (categoryId) => {
  selectedCategory.value = categoryId;
  await nextTick();
  const element = document.getElementById(`category-${categoryId}`);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const selectItem = (item) => {
  selectedItem.value = item;
};

const closeModal = () => {
  selectedItem.value = null;
};

const onSearch = (event) => {
  searchQuery.value = event.target.value;
};

onMounted(() => {
  nextTick(setupObserver);
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

watch(searchQuery, () => {
  nextTick(setupObserver);
});

useHead({
  title: () => `Queiroz Hamburgueria`,
});
</script>

<template>
  <div class="container">
    <div class="hero">
      <img
        src="https://images.unsplash.com/photo-1554306297-0c86e837d24b?q=80&w=1136&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Banner da hamburgueria"
        class="banner"
      />
      <div class="profile">
        <img src="/logo.jpg" alt="Logo da Queiroz Hamburgueria" />
        <div class="profile-info">
          <h2>Queiroz Hamburgueria</h2>
          <div class="status-row">
            <span class="status open">Aberto</span>
            <span class="delivery-info">
              <svg
                class="delivery-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              10-75min • Mínimo R$ 15,00
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="search">
      <svg
        class="search-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        fill="currentColor"
        width="20"
        height="20"
      >
        <path
          d="M500.3 443.7l-119.7-119.7c27.22-40.41 40.65-90.9 33.46-144.7C401.8 87.79 326.8 13.32 235.2 1.723C99.01-15.51-15.51 99.01 1.724 235.2c11.6 91.64 86.08 166.7 177.6 178.9c53.8 7.189 104.3-6.236 144.7-33.46l119.7 119.7c15.62 15.62 40.95 15.62 56.57 0C515.9 484.7 515.9 459.3 500.3 443.7zM79.1 208c0-70.58 57.42-128 128-128s128 57.42 128 128c0 70.58-57.42 128-128 128S79.1 278.6 79.1 208z"
        />
      </svg>
      <input
        type="text"
        name="search"
        placeholder="Buscar no cardápio"
        @input="onSearch"
        v-model="searchQuery"
      />
    </div>

    <div
      class="category-tabs"
      v-if="filteredCategories && filteredCategories.length"
    >
      <button
        v-for="category in filteredCategories"
        :key="category.id"
        class="tab"
        :class="{ active: selectedCategory === category.id }"
        @click="scrollToCategory(category.id)"
      >
        {{ category.name }}
      </button>
    </div>

    <div
      class="categories"
      v-if="filteredCategories && filteredCategories.length"
    >
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        :id="`category-${category.id}`"
        class="category"
      >
        <h3>{{ category.name }}</h3>
        <div class="items">
          <div
            v-for="item in category.items"
            :key="item.id"
            class="item"
            @click="selectItem(item)"
          >
            <img :src="item.image" :alt="item.name" />
            <div class="description">
              <h4>{{ item.name }}</h4>
              <p>{{ item.description }}</p>
              <span class="price">{{ item.price }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div v-if="selectedItem" class="modal-overlay" @click="closeModal">
      <div class="modal-card" @click.stop>
        <button class="close-btn" @click="closeModal">×</button>
        <img
          :src="selectedItem.image"
          :alt="selectedItem.name"
          class="modal-image"
        />
        <div class="modal-content">
          <h4>{{ selectedItem.name }}</h4>
          <p>{{ selectedItem.description }}</p>
          <div class="modal-price">{{ selectedItem.price }}</div>
          <button class="add-to-cart">Adicionar ao Carrinho</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 4rem 12rem 6rem 12rem;
  gap: 2rem;
  margin: 0 auto;
}

.hero {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.banner {
  width: 100%;
  height: 328px;
  object-fit: cover;
  border-radius: 1rem;
}

.profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile img {
  width: 78px;
  height: 78px;
  object-fit: cover;
  border-radius: 50%;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-info h2 {
  font-size: 2rem;
  font-weight: 500;
  color: #323232;
  margin: 0;
}

.status-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.status.open {
  background-color: rgba(0, 255, 0, 0.2);
  color: #009a00;
  padding: 0.3rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.delivery-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  font-size: 0.875rem;
  font-weight: 400;
}

.delivery-icon {
  color: #666;
  flex-shrink: 0;
}

.search {
  width: 100%;
  display: flex;
  align-items: center;
  border: 1px solid #efefef;
  border-radius: 0.5rem;
  overflow: hidden;
}

.search-icon {
  flex-shrink: 0;
  color: #ff8e24;
  width: 20px;
  height: 20px;
  margin-left: 1.5rem;
}

.search input {
  flex: 1;
  padding: 1.5rem;
  border: none;
  outline: none;
  font-size: 1rem;
  font-weight: 500;
  background: transparent;
}

.category-tabs {
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  padding: 0.5rem 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fdfdfd;
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex: 0 0 auto;
  white-space: nowrap;
  padding: 0.75rem 1.5rem;
  border: 1px solid #efefef;
  border-radius: 0.5rem;
  background: #fff;
  color: #323232;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab:hover {
  background: #f9f9f9;
}

.tab.active {
  background: #ff8e24;
  color: #fff;
  border-color: #ff8e24;
}

.categories {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.category h3 {
  color: #323232;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.items {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  cursor: pointer;
  /* transition: transform 0.2s ease, box-shadow 0.2s ease; */
  /* border-radius: 0.5rem; */
  /* padding: 1rem; */
  /* background: #fff; */
  /* border: 1px solid #efefef; */
}

/* .item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
} */

.item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  object-position: center;
  border-radius: 0.5rem;
}

.description {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.description h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #323232;
  margin: 0;
}

.description p {
  font-size: 0.875rem;
  color: #666;
  line-height: 1.4;
  margin: 0;
  flex-grow: 1;
}

.price {
  font-weight: 600;
  color: #ff8e24;
  font-size: 1rem;
  align-self: flex-start;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: #fff;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  color: #323232;
  background-color: #f0f0f0;
}

.modal-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 0.5rem;
  margin: 3rem 0 1rem 0;
}

.modal-content h4 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #323232;
  margin: 0 0 1rem 0;
}

.modal-content p {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.modal-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff8e24;
  margin-bottom: 1.5rem;
}

.add-to-cart {
  width: 100%;
  padding: 1rem;
  background: #ff8e24;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-to-cart:hover {
  background: #e67e22;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 2rem 1rem 4rem 1rem;
    gap: 1.5rem;
  }

  .hero {
    gap: 1rem;
  }

  .banner {
    height: 200px;
  }

  .profile {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .profile-info {
    align-items: flex-start;
  }

  .profile-info h2 {
    font-size: 1.5rem;
  }

  .status-row {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .delivery-info {
    font-size: 0.8rem;
  }

  .search input {
    padding: 1rem;
    font-size: 0.875rem;
  }

  .search-icon {
    margin-left: 1rem;
  }

  .category-tabs {
    gap: 0.5rem;
    padding: 0.25rem 0;
  }

  .tab {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .categories {
    gap: 2rem;
  }

  .category h3 {
    font-size: 1.25rem;
  }

  .items {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .item {
    /* padding: 0.75rem; */
    flex-direction: row;
    align-items: flex-start;
    gap: 1rem;
  }

  .item img {
    flex: 0 0 120px;
    height: 120px;
    width: 120px;
    object-fit: cover;
  }

  .description {
    flex: 1;
  }

  .description h4 {
    font-size: 1rem;
  }

  .description p {
    font-size: 0.8rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .modal-overlay {
    align-items: stretch;
  }

  .modal-card {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
    padding: 1.5rem;
    margin: 0;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .modal-card::-webkit-scrollbar {
    display: none;
  }

  .modal-image {
    margin: 3rem 0 1rem 0;
    height: 200px;
  }

  .close-btn {
    top: 0.75rem;
    right: 0.75rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 1.5rem 0.5rem 3rem 0.5rem;
  }

  .banner {
    height: 160px;
    border-radius: 0.5rem;
  }

  .profile img {
    width: 60px;
    height: 60px;
  }

  .profile-info h2 {
    font-size: 1.25rem;
  }

  .status.open {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
  }

  .delivery-info {
    font-size: 0.75rem;
  }

  .tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .item img {
    flex: 0 0 100px;
    height: 100px;
    width: 100px;
  }

  .description h4 {
    font-size: 0.95rem;
  }

  .description p {
    font-size: 0.75rem;
    -webkit-line-clamp: 1;
  }

  .modal-card {
    padding: 1rem;
  }

  .add-to-cart {
    padding: 0.875rem;
    font-size: 0.875rem;
  }
}
</style>
