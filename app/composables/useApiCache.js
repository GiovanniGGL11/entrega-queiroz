// composables/useApiCache.js
import { ref } from 'vue'

const cache = ref(new Map())
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const useApiCache = () => {
  const getCacheKey = (url, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {})
    return `${url}?${JSON.stringify(sortedParams)}`
  }

  const get = (key) => {
    const cached = cache.value.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  const set = (key, data) => {
    cache.value.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  const clear = (pattern) => {
    if (pattern) {
      for (const [key] of cache.value) {
        if (key.includes(pattern)) {
          cache.value.delete(key)
        }
      }
    } else {
      cache.value.clear()
    }
  }

  const clearExpired = () => {
    const now = Date.now()
    for (const [key, value] of cache.value) {
      if (now - value.timestamp >= CACHE_DURATION) {
        cache.value.delete(key)
      }
    }
  }

  return {
    getCacheKey,
    get,
    set,
    clear,
    clearExpired
  }
}

