# Queiroz Hamburgueria - Sistema de Delivery

Sistema completo de delivery com dashboard administrativo e interface de pedidos.

## 🚀 Tecnologias

- **Nuxt 3** - Framework Vue.js para SSR
- **MongoDB** - Banco de dados NoSQL
- **Leaflet** - Mapas interativos
- **SortableJS** - Drag and drop

## 📋 Pré-requisitos

- Node.js 18+
- MongoDB Atlas ou MongoDB local
- npm/yarn/pnpm

## ⚙️ Setup

1. **Instalar dependências:**

```bash
npm install
```

2. **Configurar variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/queiroz_hamburgueria?retryWrites=true&w=majority

# JWT Secret (gere uma string aleatória)
JWT_SECRET=sua-chave-secreta-aqui
```

3. **Criar usuário admin:**

```bash
node generate-user.js
```

## 🔧 Development Server

```bash
npm run dev
```

Servidor disponível em `http://localhost:3000`

## 📦 Production Build

```bash
npm run build
npm run preview
```

## 🌐 Deploy na Vercel

### 1. **Configurar Variáveis de Ambiente na Vercel**

No painel da Vercel, vá em:

- **Settings** → **Environment Variables**

Adicione as seguintes variáveis:

| Nome          | Valor                            | Ambiente                         |
| ------------- | -------------------------------- | -------------------------------- |
| `MONGODB_URI` | Sua connection string do MongoDB | Production, Preview, Development |
| `JWT_SECRET`  | Sua chave secreta JWT            | Production, Preview, Development |

### 2. **Connection String do MongoDB**

Se estiver usando MongoDB Atlas:

1. Acesse o MongoDB Atlas
2. Vá em **Network Access** → **IP Whitelist**
3. Adicione `0.0.0.0/0` (permitir todas as conexões)
   - ⚠️ **Importante**: Em produção, considere restringir IPs específicos da Vercel
4. Copie a connection string em **Connect** → **Connect your application**
5. Substitua `<password>` pela senha do usuário
6. Use essa string na variável `MONGODB_URI`

### 3. **Deploy**

```bash
# Deploy automático via Git
git push origin main

# Ou usando Vercel CLI
npm i -g vercel
vercel --prod
```

### 4. **Verificar Logs**

Se houver erro após o deploy:

1. Acesse o painel da Vercel
2. Vá em **Deployments** → Selecione o deployment
3. Clique em **View Function Logs**
4. Verifique se o MongoDB está conectando

### 5. **Checklist de Deploy**

- [ ] Variável `MONGODB_URI` configurada na Vercel
- [ ] Variável `JWT_SECRET` configurada na Vercel
- [ ] MongoDB Atlas com IP `0.0.0.0/0` permitido
- [ ] Usuário admin criado no banco
- [ ] Build bem-sucedido sem erros
- [ ] APIs retornando 200 (não 500)

## 🗂️ Estrutura do Projeto

```
delivery/
├── app/
│   ├── layouts/          # Layouts (dashboard)
│   ├── middleware/       # Middlewares de autenticação
│   ├── pages/           # Páginas (home, dashboard, login)
│   └── assets/css/      # Estilos globais
├── server/
│   ├── api/             # Endpoints da API
│   ├── middleware/      # Middlewares do servidor
│   └── utils/           # Utilitários (DB connection)
├── public/              # Arquivos estáticos
└── generate-user.js     # Script para criar admin
```

## 📱 Funcionalidades

### Cliente (Home)

- Visualização do cardápio por categorias
- Busca de produtos
- Carrinho de compras
- Cálculo de frete por distância
- Sistema de complementos
- Finalização de pedido via WhatsApp

### Dashboard Admin

- Gerenciamento de categorias
- Gerenciamento de produtos
- Upload de imagens (Base64 no MongoDB)
- Configurações da loja
- Horários de funcionamento
- Zonas de entrega com mapa interativo
- Sistema de drag-and-drop para ordenação

## 🔐 Acesso ao Dashboard

URL: `/dashboard`

- Login com credenciais criadas via `generate-user.js`

## 🐛 Troubleshooting

### Erro 500 nas APIs

**Sintomas:** APIs retornam erro 500 na Vercel

**Possíveis causas e soluções:**

1. **MONGODB_URI não configurada**

   - ✅ Verifique em: Vercel Dashboard → Settings → Environment Variables
   - ✅ Certifique-se de que está configurada para Production, Preview e Development
   - ✅ Faça redeploy após adicionar

2. **MongoDB Atlas bloqueando conexões**

   - ✅ Acesse: MongoDB Atlas → Network Access
   - ✅ Adicione IP: `0.0.0.0/0` (permitir todos)
   - ✅ Aguarde 1-2 minutos para propagar

3. **Connection String incorreta**
   - ✅ Deve começar com `mongodb+srv://`
   - ✅ Substitua `<password>` pela senha real
   - ✅ Não deve ter espaços ou caracteres especiais não-encoded

**Como debugar na Vercel:**

1. Acesse: https://vercel.com/seu-usuario/queiroz-delivery
2. Vá em **Deployments** → Selecione o deployment atual
3. Clique em **View Function Logs** ou **Runtime Logs**
4. Procure por:

   ```
   [DB] ERRO CRÍTICO: MONGODB_URI não está definida
   [DB] ❌ ERRO DE CONEXÃO
   [settings.get] ERRO DETALHADO
   [categories-with-products] ERRO DETALHADO
   ```

5. Os logs agora mostram:
   - Se a variável MONGODB_URI existe
   - Detalhes do erro de conexão
   - Stack trace completo
   - Código do erro

**Testando APIs diretamente:**

```bash
# Testar settings
curl https://queiroz-delivery.vercel.app/api/settings

# Testar categorias
curl https://queiroz-delivery.vercel.app/api/categories-with-products
```

Se retornar JSON = ✅ Funcionando
Se retornar erro 500 = ❌ Ver logs da Vercel

### Dados não aparecem

- Verifique se as categorias e produtos foram criados no dashboard
- Verifique se as configurações da loja foram salvas

### Imagens não carregam

- As imagens são armazenadas em Base64 no MongoDB
- Tamanho máximo: 5MB por imagem

## 📚 Referências

- [Nuxt 3 Documentation](https://nuxt.com)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Vercel Deployment](https://vercel.com/docs)

---

Desenvolvido por [G2 Genesys](https://www.instagram.com/g2genesys/)
