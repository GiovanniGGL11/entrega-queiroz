// nuxt.config.ts
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
          integrity: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
          crossorigin: ''
        }
      ],
      script: [
        {
          src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
          integrity: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
          crossorigin: ''
        }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    mongodbUri: process.env.MONGODB_URI,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  nitro: {
    esbuild: {
      options: {
        target: "es2022",
      },
    },
    // Configurações de cache e performance
    routeRules: {
      // APIs públicas com cache (melhora performance)
      '/api/public/**': { 
        cors: true,
        headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' }, // 5 min cache, 10 min stale
        prerender: false
      },
      '/api/categories-with-products': { 
        cors: true,
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
      },
      '/api/categories': { 
        cors: true,
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
      },
      '/api/products': { 
        cors: true,
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
      },
      '/api/product': { 
        cors: true,
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
      },
      
      // APIs sem cache (mudam frequentemente)
      '/api/auth/**': { cors: true },
      '/api/orders': { cors: true },
      '/api/calculate-delivery': { cors: true },
      
      // APIs administrativas (protegidas por middleware)
      '/api/dashboard/**': { cors: true },
      '/api/inventory/**': { cors: true },
      '/api/settings': { cors: true },
      '/api/upload-image': { cors: true },
    },
  },
});
