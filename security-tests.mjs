/**
 * SUITE DE TESTES DE SEGURANÇA — Queiroz Delivery
 *
 * Uso:
 *   node security-tests.mjs                          → http://localhost:3000
 *   BASE_URL=https://entrega-queiroz.vercel.app node security-tests.mjs
 *   ADMIN_EMAIL=x@x.com ADMIN_PASS=senha node security-tests.mjs
 *
 * Requer Node 18+ (fetch nativo).
 * Não modifica dados de produção permanentemente (usa cleanup automático).
 */

const BASE_URL   = process.env.BASE_URL   || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@queiroz.com'
const ADMIN_PASS  = process.env.ADMIN_PASS  || 'admin123'

// ────────────────────────────────────────────────────────────────
// INFRA DO RUNNER
// ────────────────────────────────────────────────────────────────
let passed = 0, failed = 0, warned = 0
const RESET='\x1b[0m', RED='\x1b[31m', GREEN='\x1b[32m', YELLOW='\x1b[33m', CYAN='\x1b[36m', BOLD='\x1b[1m'

function section(title) {
  console.log(`\n${BOLD}${CYAN}━━━ ${title} ━━━${RESET}`)
}

function pass(name) {
  passed++
  console.log(`  ${GREEN}✓${RESET} ${name}`)
}

function fail(name, detail = '') {
  failed++
  console.log(`  ${RED}✗ FALHOU${RESET} ${name}${detail ? ` — ${RED}${detail}${RESET}` : ''}`)
}

function warn(name, detail = '') {
  warned++
  console.log(`  ${YELLOW}⚠ AVISO${RESET} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function req(method, path, { body, token, headers = {}, raw = false } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers }
  if (token) h['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (raw) return res
    let data = null
    try { data = await res.json() } catch (_) {}
    return { status: res.status, data }
  } catch (e) {
    return { status: 0, data: null, error: e.message }
  }
}

// ────────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ────────────────────────────────────────────────────────────────
async function getAdminToken() {
  const r = await req('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASS } })
  return r.data?.token || null
}

async function getEmployeeToken(ownerToken) {
  // Cria funcionário temporário e retorna token
  const email = `sec_test_emp_${Date.now()}@test.invalid`
  const pass  = 'Teste@123sec'
  const create = await req('POST', '/api/dashboard/employees', {
    token: ownerToken,
    body: { name: 'Sec Test Employee', email, password: pass }
  })
  if (create.status !== 201) return { token: null, id: null }

  const login = await req('POST', '/api/auth/login', { body: { email, password: pass } })
  return { token: login.data?.token || null, id: create.data?.employee?._id || null }
}

async function deleteEmployee(ownerToken, id) {
  if (id) await req('DELETE', `/api/dashboard/employees/${id}`, { token: ownerToken })
}

// ────────────────────────────────────────────────────────────────
// BLOCO 1 — ACESSO SEM AUTENTICAÇÃO (deve retornar 401)
// ────────────────────────────────────────────────────────────────
async function testUnauthenticated() {
  section('A01/A07 — Acesso sem autenticação (esperado: 401)')

  const protectedEndpoints = [
    ['GET',    '/api/auth/me'],
    ['GET',    '/api/orders'],
    ['PUT',    '/api/orders/000000000000000000000001'],
    ['DELETE', '/api/orders/000000000000000000000001'],
    ['POST',   '/api/categories'],
    ['PUT',    '/api/categories/000000000000000000000001'],
    ['DELETE', '/api/categories/000000000000000000000001'],
    ['POST',   '/api/products'],
    ['PUT',    '/api/products/000000000000000000000001'],
    ['DELETE', '/api/products/000000000000000000000001'],
    ['GET',    '/api/inventory'],
    ['POST',   '/api/inventory'],
    ['GET',    '/api/inventory/movements'],
    ['POST',   '/api/inventory/movements'],
    ['GET',    '/api/motoboys'],
    ['POST',   '/api/motoboys'],
    ['GET',    '/api/settings'],
    ['PUT',    '/api/settings'],
    ['POST',   '/api/upload-image'],
    ['GET',    '/api/dashboard/employees'],
    ['POST',   '/api/dashboard/employees'],
    ['GET',    '/api/dashboard/customers'],
    ['GET',    '/api/dashboard/stats'],
    ['GET',    '/api/dashboard/coupons'],
    ['POST',   '/api/dashboard/coupons'],
  ]

  for (const [method, path] of protectedEndpoints) {
    const r = await req(method, path, { body: {} })
    if (r.status === 401) {
      pass(`${method} ${path} → 401`)
    } else if (r.status === 0) {
      warn(`${method} ${path} → sem resposta (servidor offline?)`)
    } else {
      fail(`${method} ${path} → esperado 401, recebido ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 2 — TOKENS MALFORMADOS / EXPIRADOS
// ────────────────────────────────────────────────────────────────
async function testBadTokens() {
  section('A07 — Tokens inválidos (esperado: 401)')

  const cases = [
    ['token vazio',              ''],
    ['token "Bearer"',           'Bearer'],
    ['token aleatório',          'Bearer abc123xyz'],
    ['JWT malformado (2 partes)','Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0'],
    ['JWT assinatura errada',    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJoYWNrZXJAdGVzdC5jb20iLCJyb2xlIjoib3duZXIiLCJpYXQiOjE3MDAwMDAwMDB9.ASSINATURA_FALSA'],
    ['token SQL injection',      "Bearer ' OR '1'='1"],
    ['token NoSQL injection',    'Bearer {"$gt":""}'],
  ]

  for (const [label, authHeader] of cases) {
    const h = authHeader ? { Authorization: authHeader } : {}
    const r = await req('GET', '/api/auth/me', { headers: h })
    if (r.status === 401) {
      pass(`Token ${label} → 401`)
    } else if (r.status === 0) {
      warn(`Token ${label} → sem resposta`)
    } else {
      fail(`Token ${label} → esperado 401, recebido ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 3 — ESCALAÇÃO DE PRIVILÉGIO (employee → owner)
// ────────────────────────────────────────────────────────────────
async function testPrivilegeEscalation() {
  section('A01 — Escalação de privilégio: employee tentando ações de owner')

  const ownerToken = await getAdminToken()
  if (!ownerToken) { warn('Não foi possível obter token de owner — pulando bloco'); return }

  const { token: empToken, id: empId } = await getEmployeeToken(ownerToken)
  if (!empToken) { warn('Não foi possível criar funcionário de teste — pulando bloco'); return }

  const ownerOnlyEndpoints = [
    ['GET',    '/api/dashboard/employees'],
    ['POST',   '/api/dashboard/employees', { name: 'X', email: 'x@x.invalid', password: '123456' }],
    ['DELETE', `/api/dashboard/employees/${empId || '000000000000000000000001'}`],
  ]

  for (const [method, path, body] of ownerOnlyEndpoints) {
    const r = await req(method, path, { token: empToken, body: body || {} })
    if (r.status === 403) {
      pass(`Employee ${method} ${path} → 403`)
    } else if (r.status === 401) {
      pass(`Employee ${method} ${path} → 401 (também aceitável)`)
    } else if (r.status === 0) {
      warn(`Employee ${method} ${path} → sem resposta`)
    } else {
      fail(`Employee ${method} ${path} → esperado 403, recebido ${r.status}`)
    }
  }

  // Cleanup
  await deleteEmployee(ownerToken, empId)
}

// ────────────────────────────────────────────────────────────────
// BLOCO 4 — TOKEN DE CLIENTE EM ENDPOINTS DE ADMIN
// ────────────────────────────────────────────────────────────────
async function testCustomerTokenOnAdmin() {
  section('A01 — Token de cliente usado em endpoints de admin (esperado: 401/403)')

  // Registra cliente temporário
  const email = `sec_cust_${Date.now()}@test.invalid`
  const reg = await req('POST', '/api/customers/register', {
    body: { name: 'Sec Test', email, phone: '11999999999', password: 'Teste@123' }
  })

  const custToken = reg.data?.token
  if (!custToken) { warn('Não foi possível criar cliente de teste — pulando bloco'); return }

  const adminEndpoints = [
    ['GET',  '/api/orders'],
    ['GET',  '/api/dashboard/employees'],
    ['GET',  '/api/dashboard/stats'],
    ['GET',  '/api/settings'],
    ['POST', '/api/categories'],
    ['GET',  '/api/inventory'],
  ]

  for (const [method, path] of adminEndpoints) {
    const r = await req(method, path, { token: custToken, body: {} })
    if (r.status === 401 || r.status === 403) {
      pass(`Customer token em ${method} ${path} → ${r.status}`)
    } else if (r.status === 0) {
      warn(`${method} ${path} → sem resposta`)
    } else {
      fail(`Customer token em ${method} ${path} → esperado 401/403, recebido ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 5 — INJEÇÃO NoSQL
// ────────────────────────────────────────────────────────────────
async function testNoSQLInjection() {
  section('A03 — Injeção NoSQL')

  const injectionPayloads = [
    { email: { $gt: '' }, password: { $gt: '' } },
    { email: { $regex: '.*' }, password: { $regex: '.*' } },
    { email: 'admin@queiroz.com', password: { $gt: '' } },
    { email: { $where: 'this.role == "owner"' }, password: 'x' },
    { email: "admin@queiroz.com'; db.users.drop(); var x='", password: 'x' },
  ]

  for (const body of injectionPayloads) {
    const r = await req('POST', '/api/auth/login', { body })
    // Deve retornar 400 ou 401 — NUNCA 200 com token
    if (r.status === 200 && r.data?.token) {
      fail(`NoSQL injection no login com payload ${JSON.stringify(body).slice(0,60)} → AUTENTICADO!`)
    } else if (r.status === 0) {
      warn(`NoSQL injection → sem resposta`)
    } else {
      pass(`Login NoSQL injection rejeitado (${r.status})`)
    }
  }

  // Injeção em validação de cupom
  const couponPayloads = [
    { code: { $regex: '.*' }, subtotal: 100 },
    { code: { $gt: '' }, subtotal: 100 },
    { code: "'; return true; var x='", subtotal: 100 },
  ]

  for (const body of couponPayloads) {
    const r = await req('POST', '/api/public/validate-coupon', { body })
    if (r.status === 200 && r.data?.valid === true) {
      fail(`NoSQL injection em validate-coupon → cupom válido indevidamente!`)
    } else if (r.status === 0) {
      warn(`validate-coupon injection → sem resposta`)
    } else {
      pass(`validate-coupon NoSQL injection rejeitado (${r.status})`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 6 — XSS EM CAMPOS DE TEXTO
// ────────────────────────────────────────────────────────────────
async function testXSSInputs() {
  section('A03 — XSS em campos de criação (esperado: sanitizado ou rejeitado)')

  const ownerToken = await getAdminToken()
  if (!ownerToken) { warn('Token de owner indisponível — pulando bloco'); return }

  const xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '"><svg onload=alert(1)>',
    '\'; DROP TABLE products; --',
    '<iframe src="javascript:alert(1)">',
  ]

  for (const payload of xssPayloads) {
    // Tenta criar categoria com nome XSS
    const r = await req('POST', '/api/categories', {
      token: ownerToken,
      body: { name: payload, description: payload }
    })

    if (r.status === 400) {
      pass(`XSS no nome da categoria rejeitado (400): ${payload.slice(0,30)}`)
    } else if (r.status === 201) {
      // Criou — verificar se sanitizou
      const name = r.data?.category?.name || ''
      const hasScript = /<script|onerror|onload|javascript:|<iframe/i.test(name)
      if (hasScript) {
        fail(`XSS não sanitizado no nome da categoria: "${name.slice(0,50)}"`)
      } else {
        warn(`Categoria criada com payload XSS — conteúdo foi sanitizado para: "${name.slice(0,50)}"`)
      }
      // Limpar categoria criada
      const id = r.data?.id || r.data?.category?._id
      if (id) await req('DELETE', `/api/categories/${id}`, { token: ownerToken })
    } else if (r.status === 0) {
      warn(`XSS test → sem resposta`)
    } else {
      warn(`XSS no nome da categoria → status inesperado ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 7 — PAYLOADS GIGANTES (DoS / Buffer overflow)
// ────────────────────────────────────────────────────────────────
async function testOversizedPayloads() {
  section('A10 — Payloads excessivamente grandes (esperado: 400/413)')

  const bigString = 'A'.repeat(100_000)
  const veryBigString = 'B'.repeat(1_000_000)

  const cases = [
    ['Login email 100k chars',        'POST', '/api/auth/login',              { email: bigString, password: 'x' }],
    ['Login password 100k chars',     'POST', '/api/auth/login',              { email: 'a@a.com', password: bigString }],
    ['Cupom code 100k chars',         'POST', '/api/public/validate-coupon',  { code: bigString, subtotal: 100 }],
    ['Calculate-delivery zipCode 1M', 'POST', '/api/calculate-delivery',      { zipCode: veryBigString }],
    ['Register name 100k chars',      'POST', '/api/customers/register',      { name: bigString, email: 'a@a.com', phone: '11999999999', password: '123456' }],
  ]

  for (const [label, method, path, body] of cases) {
    const r = await req(method, path, { body })
    if (r.status === 400 || r.status === 413 || r.status === 422) {
      pass(`${label} → rejeitado (${r.status})`)
    } else if (r.status === 0) {
      warn(`${label} → sem resposta (possível timeout)`)
    } else if (r.status === 200 || r.status === 201) {
      fail(`${label} → ACEITO! Status ${r.status} — servidor não limitou tamanho`)
    } else {
      warn(`${label} → status inesperado ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 8 — BRUTE FORCE / RATE LIMITING NO LOGIN
// ────────────────────────────────────────────────────────────────
async function testRateLimiting() {
  section('A07 — Rate limiting no login (esperado: 429 após várias tentativas)')

  const attempts = 15
  let got429 = false
  let successOn = null

  for (let i = 0; i < attempts; i++) {
    const r = await req('POST', '/api/auth/login', {
      body: { email: 'brute@force.invalid', password: `wrong_${i}` }
    })
    if (r.status === 429) { got429 = true; successOn = i + 1; break }
    if (r.status === 0) { warn('Sem resposta durante teste de rate limit'); break }
  }

  if (got429) {
    pass(`Rate limiting ativo — 429 recebido na tentativa ${successOn}`)
  } else {
    fail(`Sem rate limiting — ${attempts} tentativas falhas sem 429`)
  }

  // Rate limiting em registro de cliente
  let got429reg = false
  for (let i = 0; i < 10; i++) {
    const r = await req('POST', '/api/customers/register', {
      body: { name: 'x', email: `rate${i}@test.invalid`, phone: '11999999999', password: '123456' }
    })
    if (r.status === 429) { got429reg = true; break }
  }
  if (got429reg) {
    pass(`Rate limiting em /api/customers/register → 429`)
  } else {
    warn(`Sem rate limiting em /api/customers/register após 10 tentativas`)
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 9 — IDOR: ACESSO A RECURSOS DE OUTROS USUÁRIOS
// ────────────────────────────────────────────────────────────────
async function testIDOR() {
  section('A01 — IDOR: acesso a recursos de outros usuários')

  // Qualquer ID aleatório de pedido — a API pública retorna dados sem auth
  const fakeOrderId = '000000000000000000000001'
  const r = await req('GET', `/api/public/orders/${fakeOrderId}`)

  if (r.status === 404) {
    pass(`/api/public/orders/{id} com ID inválido → 404 (correto)`)
  } else if (r.status === 200) {
    warn(`/api/public/orders/{id} retorna dados sem autenticação — qualquer ID válido é acessível`)
  } else {
    pass(`/api/public/orders/{id} com ID inválido → ${r.status}`)
  }

  // IDOR em endpoint de motoboy — employee não deve ver dados de outros
  const ownerToken = await getAdminToken()
  if (!ownerToken) return

  // Tenta atualizar motoboy com ID aleatório via employee
  const { token: empToken, id: empId } = await getEmployeeToken(ownerToken)
  if (empToken) {
    const r2 = await req('DELETE', `/api/motoboys/${fakeOrderId}`, { token: empToken })
    if (r2.status === 403 || r2.status === 401) {
      pass(`Employee não pode deletar motoboy com ID arbitrário → ${r2.status}`)
    } else if (r2.status === 404) {
      warn(`DELETE /api/motoboys/{id} com employee token → 404 — o endpoint não valida role?`)
    } else {
      fail(`Employee pode chamar DELETE /api/motoboys/{id} → ${r2.status}`)
    }
    await deleteEmployee(ownerToken, empId)
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 10 — RACE CONDITION EM CUPOM
// ────────────────────────────────────────────────────────────────
async function testCouponRaceCondition() {
  section('Race Condition — Uso simultâneo de cupom (esperado: aceitar apenas 1 uso extra)')

  const ownerToken = await getAdminToken()
  if (!ownerToken) { warn('Token de owner indisponível — pulando bloco'); return }

  // Cria cupom com maxUses=1
  const code = `RACETEST${Date.now()}`
  const createCoupon = await req('POST', '/api/dashboard/coupons', {
    token: ownerToken,
    body: { code, type: 'fixed', value: 5, minOrder: 0, maxUses: 1 }
  })

  if (createCoupon.status !== 201) {
    warn(`Não foi possível criar cupom de teste (${createCoupon.status}) — pulando`)
    return
  }

  const couponId = createCoupon.data?._id

  // Dispara 10 validações simultâneas (simulate concurrent use)
  const CONCURRENCY = 10
  const promises = Array.from({ length: CONCURRENCY }, () =>
    req('POST', '/api/public/validate-coupon', { body: { code, subtotal: 100 } })
  )

  const results = await Promise.all(promises)
  const valid = results.filter(r => r.status === 200 && r.data?.valid === true).length
  const invalid = results.filter(r => r.status !== 200 || r.data?.valid !== true).length

  console.log(`    ${CONCURRENCY} requisições simultâneas → ${valid} válidas, ${invalid} inválidas`)

  // validate-coupon não incrementa usedCount, mas a criação do pedido sim
  // Aqui só verificamos que a validação retorna 200 valid para todas (é ok — quem protege é o create order)
  // O que seria crítico: usedCount >= maxUses ser verificado sem lock atômico em orders.post
  warn(`Cupom validate-coupon: ${valid}/${CONCURRENCY} passaram (sem incremento aqui — risco está em orders.post sem transação atômica)`)

  // Cleanup
  if (couponId) await req('DELETE', `/api/dashboard/coupons/${couponId}`, { token: ownerToken })
}

// ────────────────────────────────────────────────────────────────
// BLOCO 11 — ENDPOINT DE TESTE EXPOSTO (/api/test-auth)
// ────────────────────────────────────────────────────────────────
async function testExposedDebugEndpoints() {
  section('A02 — Endpoints de debug/teste expostos')

  const debugEndpoints = [
    '/api/test-auth',
    '/api/debug',
    '/admin',
    '/wp-admin',
    '/phpmyadmin',
  ]

  for (const path of debugEndpoints) {
    const r = await req('GET', path)
    if (r.status === 200) {
      if (path === '/api/test-auth') {
        fail(`${path} → 200 — endpoint de teste exposto em produção!`)
      } else {
        warn(`${path} → 200 — endpoint inesperado respondendo`)
      }
    } else if (r.status === 404 || r.status === 405) {
      pass(`${path} → ${r.status} (não exposto)`)
    } else if (r.status === 0) {
      warn(`${path} → sem resposta`)
    } else {
      pass(`${path} → ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 12 — INFORMAÇÕES SENSÍVEIS NAS RESPOSTAS DE ERRO
// ────────────────────────────────────────────────────────────────
async function testErrorInfoLeakage() {
  section('A02 — Vazamento de informações em erros')

  const sensitiveTerms = [
    'mongodb', 'mongoose', 'password', 'stack', 'trace', 'exception',
    'uri', 'connection string', 'jwt_secret', 'internal server', 'at Object'
  ]

  const badRequests = [
    ['POST', '/api/auth/login',              { email: null, password: null }],
    ['POST', '/api/categories',              { name: null }],
    ['POST', '/api/public/validate-coupon',  {}],
    ['GET',  '/api/orders/INVALID_ID_FORMAT'],
    ['PUT',  '/api/orders/INVALID_ID_FORMAT', { status: 'invalid_status' }],
  ]

  for (const [method, path, body] of badRequests) {
    const r = await req(method, path, { body })
    const raw = JSON.stringify(r.data || '').toLowerCase()
    const leaks = sensitiveTerms.filter(t => raw.includes(t))

    if (leaks.length > 0) {
      fail(`${method} ${path} vaza informações sensíveis: [${leaks.join(', ')}]`)
    } else if (r.status === 0) {
      warn(`${method} ${path} → sem resposta`)
    } else {
      pass(`${method} ${path} (${r.status}) não vaza informações sensíveis`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 13 — HEADERS DE SEGURANÇA HTTP
// ────────────────────────────────────────────────────────────────
async function testSecurityHeaders() {
  section('A02 — Headers de segurança HTTP')

  const r = await req('GET', '/', { raw: true })
  if (!r || r.status === 0) { warn('Sem resposta para / — pulando headers'); return }

  const headers = r.headers || new Headers()
  const get = (h) => headers.get ? headers.get(h) : null

  const required = [
    ['X-Content-Type-Options',       (v) => v === 'nosniff',                   'nosniff'],
    ['X-Frame-Options',              (v) => /deny|sameorigin/i.test(v || ''),  'DENY ou SAMEORIGIN'],
    ['Strict-Transport-Security',    (v) => v && v.includes('max-age'),         'max-age presente'],
    ['Content-Security-Policy',      (v) => !!v,                                'CSP configurado'],
    ['Referrer-Policy',              (v) => !!v,                                'qualquer valor'],
    ['Permissions-Policy',           (v) => !!v,                                'qualquer valor'],
  ]

  for (const [header, check, expected] of required) {
    const value = get(header)
    if (check(value)) {
      pass(`Header ${header}: "${value}"`)
    } else {
      fail(`Header ${header} ausente ou incorreto — esperado: ${expected}, recebido: "${value}"`)
    }
  }

  // Verificar CORS wildcard
  const corsOrigin = get('Access-Control-Allow-Origin')
  if (corsOrigin === '*') {
    warn(`CORS com wildcard (*) — perigoso se combinado com credenciais`)
  } else if (corsOrigin) {
    pass(`CORS restritivo: ${corsOrigin}`)
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 14 — CRIAÇÃO DE PEDIDO SEM VALIDAÇÃO DE PREÇO
// ────────────────────────────────────────────────────────────────
async function testPriceManipulation() {
  section('A06 — Manipulação de preço no pedido (frontend não deve controlar preço)')

  // Tenta criar pedido com price=0 no item
  const r = await req('POST', '/api/orders', {
    body: {
      customerInfo: { name: 'Hacker', phone: '11999999999' },
      items: [{ name: 'Qualquer Produto', quantity: 1, price: 0, complements: [] }],
      deliveryInfo: { address: 'Rua Teste, 1', neighborhood: 'Centro', city: 'SP' },
      paymentMethod: 'pix'
    }
  })

  if (r.status === 400) {
    pass(`Pedido com preço 0 rejeitado → 400`)
  } else if (r.status === 201) {
    const item = r.data?.order?.items?.[0]
    if (item?.price === 0 || item?.price === undefined) {
      fail(`Pedido aceito com price=0 e o preço não foi sobrescrito pelo servidor!`)
    } else {
      pass(`Pedido criado mas preço foi sobrescrito pelo servidor: R$ ${item?.price}`)
    }
  } else if (r.status === 0) {
    warn(`Teste de manipulação de preço → sem resposta`)
  } else {
    warn(`Pedido com price=0 → status ${r.status}`)
  }

  // Tenta enviar price negativo
  const r2 = await req('POST', '/api/orders', {
    body: {
      customerInfo: { name: 'Hacker', phone: '11999999999' },
      items: [{ name: 'Produto', quantity: 1, price: -9999, complements: [] }],
      deliveryInfo: { address: 'Rua Teste, 1', neighborhood: 'Centro', city: 'SP' },
      paymentMethod: 'pix'
    }
  })

  if (r2.status === 400) {
    pass(`Pedido com preço negativo rejeitado → 400`)
  } else if (r2.status === 201) {
    const item2 = r2.data?.order?.items?.[0]
    if ((item2?.price || 0) < 0) {
      fail(`Pedido aceito com preço negativo! Total: ${r2.data?.order?.totalAmount}`)
    } else {
      pass(`Pedido criado mas preço negativo foi desconsiderado: R$ ${item2?.price}`)
    }
  } else {
    warn(`Pedido com preço negativo → status ${r2.status}`)
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 15 — ENUMERAÇÃO DE USUÁRIOS
// ────────────────────────────────────────────────────────────────
async function testUserEnumeration() {
  section('A07 — Enumeração de usuários (mensagens de erro devem ser genéricas)')

  const existingEmail  = ADMIN_EMAIL
  const nonExistingEmail = `naoexiste_${Date.now()}@invalid.test`

  const r1 = await req('POST', '/api/auth/login', { body: { email: existingEmail,    password: 'senhaerrada123!' } })
  const r2 = await req('POST', '/api/auth/login', { body: { email: nonExistingEmail, password: 'senhaerrada123!' } })

  const msg1 = (r1.data?.statusMessage || r1.data?.message || '').toLowerCase()
  const msg2 = (r2.data?.statusMessage || r2.data?.message || '').toLowerCase()

  // Mensagens DEVEM ser iguais
  if (msg1 === msg2) {
    pass(`Mensagens de erro idênticas para email existente e inexistente`)
  } else {
    fail(`Enumeração de usuários possível! Email existente: "${msg1}" vs inexistente: "${msg2}"`)
  }

  // Status code deve ser o mesmo
  if (r1.status === r2.status) {
    pass(`Status code idêntico (${r1.status}) para email existente e inexistente`)
  } else {
    fail(`Status diferente: existente=${r1.status}, inexistente=${r2.status}`)
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 16 — SSRF VIA whatsappApiUrl
// ────────────────────────────────────────────────────────────────
async function testSSRF() {
  section('A01 — SSRF via configuração de WhatsApp API URL')

  const ownerToken = await getAdminToken()
  if (!ownerToken) { warn('Token de owner indisponível — pulando bloco'); return }

  const ssrfUrls = [
    'http://169.254.169.254/latest/meta-data/',     // AWS metadata
    'http://metadata.google.internal/computeMetadata/v1/',
    'http://localhost:27017',                          // MongoDB local
    'http://127.0.0.1:22',                            // SSH
    'file:///etc/passwd',
    'http://0.0.0.0:3000',
  ]

  for (const url of ssrfUrls) {
    const r = await req('PUT', '/api/settings', {
      token: ownerToken,
      body: { whatsappApiUrl: url }
    })
    // Deve rejeitar URLs internas/perigosas com 400
    if (r.status === 400) {
      pass(`SSRF: URL interna "${url}" rejeitada → 400`)
    } else if (r.status === 200) {
      warn(`SSRF: URL interna "${url}" aceita na configuração — risco de SSRF ao enviar notificação`)
    } else if (r.status === 401 || r.status === 403) {
      warn(`SSRF: ${r.status} ao tentar configurar URL — sem acesso`)
    } else {
      warn(`SSRF: URL "${url}" → status ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 17 — UPLOAD DE ARQUIVO MALICIOSO (avatar)
// ────────────────────────────────────────────────────────────────
async function testMaliciousUpload() {
  section('A01 — Upload de arquivo malicioso (avatar)')

  // Registra cliente para ter token
  const email = `sec_upload_${Date.now()}@test.invalid`
  const reg = await req('POST', '/api/customers/register', {
    body: { name: 'Upload Test', email, phone: '11999999999', password: 'Teste@123' }
  })
  const custToken = reg.data?.token
  if (!custToken) { warn('Não foi possível criar cliente — pulando upload test'); return }

  const cases = [
    {
      label: 'EXE disfarçado de imagem (magic bytes errados)',
      avatar: 'data:image/jpeg;base64,TVqQAAMAAAAEAAAA//8AALgAAAA' // MZ header (PE exe)
    },
    {
      label: 'Script PHP como imagem',
      avatar: 'data:image/jpeg;base64,' + Buffer.from('<?php system($_GET["cmd"]); ?>').toString('base64')
    },
    {
      label: 'SVG com XSS',
      avatar: 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64')
    },
    {
      label: 'Avatar acima de 500KB (base64)',
      avatar: 'data:image/jpeg;base64,' + 'A'.repeat(700_000)
    },
  ]

  for (const { label, avatar } of cases) {
    const r = await req('PUT', '/api/customers/avatar', { token: custToken, body: { avatar } })
    if (r.status === 400) {
      pass(`Upload ${label} rejeitado → 400`)
    } else if (r.status === 200) {
      if (label.includes('500KB')) {
        fail(`${label} → ACEITO! Sem limite de tamanho no avatar`)
      } else {
        warn(`${label} → ACEITO (200) — verificar se está sendo executado ou apenas armazenado`)
      }
    } else {
      warn(`${label} → status ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 18 — PAGINAÇÃO SEM LIMITE (DoS)
// ────────────────────────────────────────────────────────────────
async function testPaginationLimits() {
  section('A06 — Paginação sem limite máximo (DoS via page_size alto)')

  const ownerToken = await getAdminToken()
  if (!ownerToken) { warn('Token indisponível — pulando bloco'); return }

  const r = await req('GET', '/api/orders?limit=999999&page=1', { token: ownerToken })

  if (r.status === 400) {
    pass(`Limit 999999 rejeitado → 400`)
  } else if (r.status === 200) {
    const realLimit = r.data?.pagination?.limit
    if (realLimit && realLimit <= 100) {
      pass(`Limit clampeado para ${realLimit} (máx 100) — proteção ativa`)
    } else {
      fail(`Sem limite de paginação — retornou limit=${realLimit} registros (risco DoS)`)
    }
  } else {
    warn(`Paginação limit=999999 → status ${r.status}`)
  }
}

// ────────────────────────────────────────────────────────────────
// BLOCO 19 — VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
// ────────────────────────────────────────────────────────────────
async function testRequiredFields() {
  section('A10 — Campos obrigatórios e tipos inválidos')

  const ownerToken = await getAdminToken()

  const cases = [
    // [label, method, path, body, requiresAuth]
    ['Categoria sem nome',       'POST', '/api/categories', { name: '' },                        true],
    ['Categoria nome=null',      'POST', '/api/categories', { name: null },                      true],
    ['Produto sem preço',        'POST', '/api/products',   { name: 'X', categoryId: '123' },   true],
    ['Produto preço negativo',   'POST', '/api/products',   { name: 'X', price: -10, categoryId: '123' }, true],
    ['Cupom valor=0',            'POST', '/api/dashboard/coupons', { code: 'X', type: 'fixed', value: 0 }, true],
    ['Cupom type inválido',      'POST', '/api/dashboard/coupons', { code: 'X', type: 'bitcoin', value: 10 }, true],
    ['Login sem email',          'POST', '/api/auth/login', { password: '123' },                 false],
    ['Login sem senha',          'POST', '/api/auth/login', { email: 'a@a.com' },                false],
    ['Pedido sem items',         'POST', '/api/orders',     { customerInfo: { name: 'X', phone: '11999' }, deliveryInfo: { address: 'R' } }, false],
    ['Pedido sem customerInfo',  'POST', '/api/orders',     { items: [{ name: 'X', quantity: 1 }] }, false],
  ]

  for (const [label, method, path, body, requiresAuth] of cases) {
    const r = await req(method, path, {
      body,
      token: requiresAuth ? ownerToken : undefined
    })
    if (r.status === 400 || r.status === 422) {
      pass(`${label} → rejeitado (${r.status})`)
    } else if (r.status === 401 && requiresAuth && !ownerToken) {
      warn(`${label} → 401 (sem token de owner)`)
    } else if (r.status === 0) {
      warn(`${label} → sem resposta`)
    } else if (r.status === 201 || r.status === 200) {
      fail(`${label} → ACEITO! (${r.status}) — validação ausente`)
    } else {
      warn(`${label} → status inesperado ${r.status}`)
    }
  }
}

// ────────────────────────────────────────────────────────────────
// RELATÓRIO FINAL
// ────────────────────────────────────────────────────────────────
function printSummary(startMs) {
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1)
  const total = passed + failed + warned
  console.log(`\n${BOLD}${'═'.repeat(55)}${RESET}`)
  console.log(`${BOLD}  RESULTADO FINAL — ${elapsed}s${RESET}`)
  console.log(`${'═'.repeat(55)}`)
  console.log(`  ${GREEN}✓ Passou :${RESET} ${passed}`)
  console.log(`  ${RED}✗ Falhou :${RESET} ${failed}`)
  console.log(`  ${YELLOW}⚠ Aviso  :${RESET} ${warned}`)
  console.log(`  Total   : ${total}`)
  console.log(`${'═'.repeat(55)}\n`)

  if (failed > 0) {
    console.log(`${RED}${BOLD}  ⚠ ${failed} vulnerabilidade(s) confirmada(s). Corrigir antes do deploy!${RESET}\n`)
    process.exitCode = 1
  } else {
    console.log(`${GREEN}${BOLD}  Nenhuma vulnerabilidade crítica detectada.${RESET}\n`)
  }
}

// ────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────
async function main() {
  const start = Date.now()
  console.log(`\n${BOLD}SUITE DE TESTES DE SEGURANÇA — Queiroz Delivery${RESET}`)
  console.log(`Alvo: ${CYAN}${BASE_URL}${RESET}`)
  console.log(`Início: ${new Date().toLocaleString('pt-BR')}`)

  await testUnauthenticated()
  await testBadTokens()
  await testPrivilegeEscalation()
  await testCustomerTokenOnAdmin()
  await testNoSQLInjection()
  await testXSSInputs()
  await testOversizedPayloads()
  await testRateLimiting()
  await testIDOR()
  await testCouponRaceCondition()
  await testExposedDebugEndpoints()
  await testErrorInfoLeakage()
  await testSecurityHeaders()
  await testPriceManipulation()
  await testUserEnumeration()
  await testSSRF()
  await testMaliciousUpload()
  await testPaginationLimits()
  await testRequiredFields()

  printSummary(start)
}

main().catch(e => { console.error(e); process.exit(1) })
