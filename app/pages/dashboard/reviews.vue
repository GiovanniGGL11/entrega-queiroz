<template>
  <div class="reviews-page">
    <div class="page-header">
      <h1>Avaliações</h1>
    </div>

    <div v-if="loading" class="loading-wrap">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <!-- Resumo -->
      <div class="summary-grid">
        <div class="summary-card main-score">
          <div class="score-number">{{ data.average || '—' }}</div>
          <div class="score-stars">
            <span v-for="s in 5" :key="s" class="star" :class="{ filled: s <= Math.round(data.average) }">★</span>
          </div>
          <div class="score-total">{{ data.total }} avaliação{{ data.total !== 1 ? 'ões' : '' }}</div>
        </div>

        <div class="summary-card distribution-card">
          <div v-for="item in data.distribution" :key="item.stars" class="dist-row">
            <span class="dist-label">{{ item.stars }}★</span>
            <div class="dist-bar-wrap">
              <div class="dist-bar" :style="{ width: data.total ? (item.count / data.total * 100) + '%' : '0%' }"></div>
            </div>
            <span class="dist-count">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- Lista -->
      <div class="reviews-list">
        <div v-if="!data.reviews?.length" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <p>Nenhuma avaliação ainda.</p>
        </div>

        <div v-for="r in data.reviews" :key="r.orderId" class="review-item">
          <div class="review-header">
            <div class="review-customer">
              <div class="review-avatar">{{ r.customerName.charAt(0).toUpperCase() }}</div>
              <div>
                <div class="review-name">{{ r.customerName }}</div>
                <div class="review-order">Pedido #{{ r.orderNumber }}</div>
              </div>
            </div>
            <div class="review-meta">
              <div class="review-stars">
                <span v-for="s in 5" :key="s" class="star" :class="{ filled: s <= r.stars }">★</span>
              </div>
              <div class="review-date">{{ formatDate(r.createdAt) }}</div>
            </div>
          </div>
          <p v-if="r.comment" class="review-comment">"{{ r.comment }}"</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' })

const { getAuthHeaders } = useAuthenticatedFetch()
const loading = ref(true)
const data = ref({ total: 0, average: 0, distribution: [], reviews: [] })

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  try {
    const res = await fetch('/api/dashboard/reviews', { headers: getAuthHeaders() })
    if (res.ok) data.value = await res.json()
  } catch {} finally {
    loading.value = false
  }
})
</script>

<style scoped>
.reviews-page { padding: 1.5rem; max-width: 900px; }
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #111; }

.loading-wrap { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #f97316; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.summary-grid { display: grid; grid-template-columns: 200px 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
@media (max-width: 600px) { .summary-grid { grid-template-columns: 1fr; } }

.summary-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }

.main-score { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; }
.score-number { font-size: 3.5rem; font-weight: 800; color: #111; line-height: 1; }
.score-stars { display: flex; gap: 0.15rem; }
.score-total { font-size: 0.85rem; color: #888; }

.distribution-card { display: flex; flex-direction: column; justify-content: center; gap: 0.6rem; }
.dist-row { display: flex; align-items: center; gap: 0.75rem; }
.dist-label { font-size: 0.85rem; color: #555; min-width: 24px; text-align: right; }
.dist-bar-wrap { flex: 1; background: #f3f4f6; border-radius: 99px; height: 8px; overflow: hidden; }
.dist-bar { height: 100%; background: #f59e0b; border-radius: 99px; transition: width 0.4s; }
.dist-count { font-size: 0.82rem; color: #888; min-width: 20px; }

.star { font-size: 1.2rem; color: #e5e7eb; }
.star.filled { color: #f59e0b; }

.reviews-list { display: flex; flex-direction: column; gap: 1rem; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; color: #aaa; text-align: center; }
.empty-state p { margin: 0; }

.review-item { background: white; border-radius: 14px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
.review-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
.review-customer { display: flex; align-items: center; gap: 0.75rem; }
.review-avatar { width: 40px; height: 40px; border-radius: 50%; background: #f97316; color: white; font-weight: 700; font-size: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.review-name { font-weight: 600; font-size: 0.95rem; color: #111; }
.review-order { font-size: 0.8rem; color: #888; }
.review-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
.review-stars { display: flex; gap: 0.1rem; }
.review-date { font-size: 0.78rem; color: #aaa; }
.review-comment { margin: 0.75rem 0 0; font-size: 0.9rem; color: #444; line-height: 1.5; font-style: italic; }
</style>
