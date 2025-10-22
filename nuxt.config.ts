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
  },
  nitro: {
    esbuild: {
      options: {
        target: "es2022",
      },
    },
    // Configurações de segurança
    routeRules: {
      // APIs públicas (não precisam de autenticação)
      '/api/auth/**': { cors: true },
      '/api/orders': { cors: true },
      '/api/calculate-delivery': { cors: true },
      '/api/categories-with-products': { cors: true },
      '/api/product': { cors: true },
      '/api/products': { cors: true },
      '/api/categories': { cors: true },
      '/api/public/**': { cors: true },
      '/api/test-auth': { cors: true },
      
      // APIs administrativas (protegidas por middleware)
      '/api/dashboard/**': { cors: true },
      '/api/inventory/**': { cors: true },
      '/api/settings': { cors: true },
      '/api/upload-image': { cors: true },
    },
  },
  // Configurações de segurança
  security: {
    headers: {
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp',
      contentSecurityPolicy: {
        'base-uri': ["'self'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'object-src': ["'none'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'script-src': ["'self'", 'https:', "'unsafe-inline'"],
        'upgrade-insecure-requests': true
      }
    }
  }
});
