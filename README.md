# Recicloth — Loja Online de Vestuário Reciclado

## Manual de Implementação

---

## 1. Introdução

### Objetivo do sistema

A **Recicloth** é uma prova de conceito (PoC) de uma loja online de vestuário reciclado, desenvolvida como Sistema de Informação Web (WIS) com alojamento próprio. O sistema demonstra:

- Implementação funcional de um carrinho de compras com checkout completo
- Parametrização de regras de negócio (IVA, portes UE via tabelas CTT, estados de encomenda)
- Integração de políticas legais (RGPD, devoluções, termos e condições, entregas na UE)
- Painel de administração para gestão de produtos, encomendas e utilizadores
- Análise e justificação das escolhas tecnológicas

### Descrição da loja

A Recicloth comercializa vestuário inserido na economia circular:

- **Reutilização** — peças de segunda mão em bom estado
- **Upcycling** — peças transformadas criativamente a partir de materiais existentes
- **Reciclagem têxtil** — produtos fabricados com fibras recicladas

Cada produto tem stock unitário ou muito limitado (caráter único), descrição detalhada de estado/material/tipo, e imagens reais.

---

## 2. Tecnologia utilizada

### Tipo de alojamento

**Alojamento realizado pelo estudante** — abordagem B, nota máxima até 20 valores.

O sistema é uma **Single Page Application (SPA)** com arquitetura cliente–servidor:

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend (SPA) | React + TypeScript | 18.x / 5.x |
| Build tool | Vite | 7.x |
| Estilo | Tailwind CSS | 3.x |
| Routing | React Router DOM | 7.x |
| Estado global | Zustand | 5.x |
| Backend API | Node.js + Express + TypeScript | 20.x / 4.x |
| Base de dados | PostgreSQL (via Supabase) | 15.x |
| Alojamento | Vercel (frontend + serverless API) | — |
| Pagamentos | Stripe | — |
| Email transacional | Resend | — |
| Analytics | Google Analytics 4 | — |
| Imagens | Sharp (processamento) + disco / S3 | — |

### Justificação

- **React + Vite** — desenvolvimento rápido com hot-module replacement, build otimizado com compressão gzip/brotli e code-splitting automático.
- **TypeScript** em todo o projeto — segurança de tipos, deteção precoce de erros, contratos explícitos entre frontend e backend.
- **PostgreSQL / Supabase** — base de dados relacional robusta com suporte a JSON, transações ACID e pool de ligações gerido.
- **Vercel** — deployment contínuo a partir de Git, edge network global, serverless functions para o backend sem gestão de servidores.
- **Stripe** — processamento de pagamentos PCI-compliant com suporte a webhooks para atualização fiável de estados de encomenda.
- **Resend** — envio de emails transacionais (confirmação de encomenda, OTP, contacto) com API simples e boa entregabilidade.

---

## 3. Ambiente de implementação

### Plataforma de alojamento

| Serviço | Função |
|---------|--------|
| **Vercel** | Serve o frontend (SPA estático) e o backend (serverless function em `/api`) |
| **Supabase** | PostgreSQL gerido na cloud, região UE (Frankfurt) |
| **Stripe** | Gateway de pagamento; webhooks recebidos em `/api/payment/webhook` |
| **Resend** | SMTP transacional via API |
| **Google OAuth** | Autenticação social |

### Configuração de variáveis de ambiente

**Backend** (`backend/.env`):

```env
DB_HOST=           # host Supabase (pooler)
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=
DB_SSL=true
DB_POOL_MAX=2

JWT_SECRET=
REFRESH_TOKEN_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=
EMAIL_FROM=noreply@recicloth.com

FRONTEND_URL=https://recicloth.vercel.app,https://recicloth.com

GOOGLE_CLIENT_ID=
```

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=/api
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GOOGLE_CLIENT_ID=
```

---

## 4. Instalação / Setup

### Pré-requisitos

- Node.js 20+
- npm 10+
- Conta Vercel (CLI: `npm i -g vercel`)
- Conta Supabase com projeto criado
- Conta Stripe com produto configurado
- Conta Resend com domínio verificado

### Passos locais

```bash
# 1. Clonar o repositório
git clone https://github.com/<user>/recicloth.git
cd recicloth

# 2. Instalar dependências
npm --prefix frontend install
npm --prefix backend install

# 3. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar ambos os ficheiros com as credenciais reais

# 4. Criar as tabelas na base de dados
# Executar o ficheiro db.sql no painel SQL do Supabase
# (ou via psql: psql $DATABASE_URL < db.sql)

# 5. Iniciar em desenvolvimento
npm --prefix frontend run dev     # http://localhost:5173
npm --prefix backend run dev      # http://localhost:3001
```

### Deploy para Vercel

```bash
# Primeira vez
vercel

# Deploys seguintes
vercel --prod
```

O ficheiro `vercel.json` na raiz já está configurado:

```json
{
  "regions": ["dub1"],
  "installCommand": "npm --prefix frontend install && npm --prefix backend install",
  "buildCommand": "npm --prefix frontend run build",
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/index.ts": { "maxDuration": 30 }
  },
  "routes": [
    { "src": "^/api/(.*)$", "dest": "/api/index.ts" },
    { "handle": "filesystem" },
    { "src": "^/(.*)$", "dest": "/index.html" }
  ]
}
```

A regra final (`^/(.*)$ → /index.html`) redireciona todos os caminhos para o `index.html`, o que é obrigatório para SPAs com routing do lado do cliente.

---

## 5. Configuração da loja

### Identidade visual

| Elemento | Detalhe |
|----------|---------|
| Nome | Recicloth |
| Logótipo | SVG inline no `Navbar.tsx` |
| Tema de cor | Verde primário (`#16a34a`) — remete para sustentabilidade |
| Framework de estilo | Tailwind CSS com configuração de cor personalizada |
| Tipografia | Sistema sans-serif (Inter via fallback nativo) |

### Estrutura de rotas (bilíngue PT / EN)

A loja suporta duas línguas em simultâneo com URLs localizadas:

| Página | PT | EN |
|--------|----|----|
| Início | `/` | `/` |
| Loja | `/loja` | `/shop` |
| Produto | `/produto/:id` | `/product/:id` |
| Carrinho | `/carrinho` | `/cart` |
| Checkout | `/finalizar-compra` | `/checkout` |
| Perfil | `/perfil` | `/profile` |
| Encomendas | `/encomendas` | `/orders` |
| Favoritos | `/favoritos` | `/favorites` |
| Política de devolução | `/politica-devolucao` | `/return-policy` |
| Política de privacidade | `/politica-privacidade` | `/privacy-policy` |
| Termos e Condições | `/termos-condicoes` | `/terms-conditions` |
| Contacto | `/contacto` | `/contact` |

### Painel de administração

Acessível em `/admin` (apenas utilizadores com role `admin`):

- Dashboard com estatísticas (vendas, encomendas, utilizadores)
- Gestão de produtos (criar, editar, arquivar)
- Gestão de categorias
- Gestão de encomendas com atualização de estado
- Gestão de utilizadores
- Gestão de hero slides
- Moderação de reviews

---

## 6. Gestão de produtos

### Requisitos mínimos cumpridos

- **≥ 10 produtos** ativos no catálogo
- Stock unitário ou limitado (produto de caráter único)

### Atributos de cada produto

| Campo | Descrição |
|-------|-----------|
| Nome (PT + EN) | Título do produto nas duas línguas |
| Preço | Em euros (€), com IVA incluído |
| Descrição (PT + EN) | Texto longo com editor WYSIWYG (TipTap) |
| Estado | Ex: Muito bom, Bom, Razoável |
| Material | Ex: Algodão orgânico, Poliéster reciclado |
| Tipo | `reciclado` / `upcycled` / `segunda mão` |
| Imagens | Múltiplas, reais, processadas com Sharp (WebP + miniatura) |
| Cores disponíveis | Array de objetos `{name, hex}` |
| Tamanhos | Array (XS, S, M, L, XL, …) |
| Stock por variante | Quantidade por combinação cor+tamanho |
| Categoria | Ligação à tabela de categorias |
| Peso (kg) | Usado no cálculo de portes (default 0,4 kg) |

### Categorias existentes

- Homem
- Mulher
- Acessórios
- Upcycled

### API de produtos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products` | Listar com filtros (categoria, cor, tamanho, preço, ordenação) |
| GET | `/api/products/:id` | Detalhe do produto |
| POST | `/api/products` | Criar (admin) |
| PUT | `/api/products/:id` | Editar (admin) |
| DELETE | `/api/products/:id` | Arquivar (admin) |

---

## 7. Implementação do carrinho

### Funcionamento

O carrinho é gerido no estado global do lado do servidor (tabela `cart_items` em PostgreSQL) para utilizadores autenticados, e em `localStorage` para visitantes, com sincronização automática no login.

### Funcionalidades

- **Adicionar produto** com seleção de cor e tamanho
- **Remover produto** individualmente
- **Atualizar quantidade** (dentro do stock disponível)
- **Total automático** — subtotal + portes calculados em tempo real
- **Toast de confirmação** ao adicionar ao carrinho
- **Contagem de itens** visível no ícone da navbar

### API do carrinho

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cart` | Obter itens do carrinho |
| POST | `/api/cart` | Adicionar item |
| PUT | `/api/cart/:id` | Atualizar quantidade |
| DELETE | `/api/cart/:id` | Remover item |
| DELETE | `/api/cart` | Limpar carrinho |

---

## 8. Checkout

### Fluxo completo

```
Carrinho → Checkout → Pagamento (Stripe) → Confirmação por email
```

### Campos do formulário

**Dados do cliente:**
- Nome completo
- Email
- Confirmação de email (convidados) + verificação OTP
- Telefone (com seletor de código de país)

**Morada de entrega:**
- Linha 1 e 2
- Cidade
- Código postal
- País (limitado à UE — ver Secção 9)

**Método de envio:**
Calculado automaticamente com base no país e peso total dos artigos (tabelas CTT).

**Método de pagamento:**
Stripe Elements integrado — cartão de crédito/débito com 3D Secure.

### Verificação de email para convidados (OTP)

Clientes não autenticados têm de:

1. Preencher email + confirmação de email
2. Receber código OTP de 6 dígitos por email (válido 10 minutos, máximo 5 tentativas)
3. Introduzir o código antes de prosseguir para pagamento

### Tratamento pós-pagamento

O Stripe envia um webhook para `/api/payment/webhook`. O sistema:

1. Verifica a assinatura do webhook
2. Cria a encomenda na base de dados com estado **Pago**
3. Envia email de confirmação com detalhes da encomenda, imagens dos produtos e custo de envio
4. Limpa o carrinho

---

## 9. Parametrização de negócio

### IVA

```typescript
VAT_RATE: 0.23  // 23% — taxa normal em Portugal
```

O IVA está incluído nos preços apresentados ao consumidor (preço final). O valor é configurado em `backend/src/config/businessRules.ts`.

### Portes de entrega — apenas União Europeia

A Recicloth só aceita encomendas para países da UE. As tarifas são baseadas nas tabelas de preços CTT (fevereiro 2026):

**Portugal continental:**

| Peso máximo | Preço |
|-------------|-------|
| 50 g | €1,58 |
| 500 g | €2,34 |
| 2 000 g | €5,55 |

**Resto da UE:**

| Peso máximo | Preço |
|-------------|-------|
| 50 g | €2,65 |
| 250 g | €4,25 |
| 500 g | €7,05 |
| 1 000 g | €10,85 |
| 2 000 g | €18,47 |

**Envio gratuito a partir de €75** (configurável em `FREE_SHIPPING_THRESHOLD`).

**Prazo de entrega:**

| Destino | Prazo |
|---------|-------|
| Portugal | 2–3 dias úteis |
| Resto UE | 5–10 dias úteis |

**Países elegíveis (27 estados-membros da UE):**
PT, DE, AT, BE, BG, CY, HR, DK, SK, SI, ES, EE, FI, FR, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, CZ, RO, SE

### Pagamentos

| Método | Estado |
|--------|--------|
| Stripe (cartão de crédito/débito) | Implementado e funcional |
| 3D Secure | Suportado automaticamente pelo Stripe |
| Webhooks de confirmação | Implementados (`payment_intent.succeeded`) |

### Estados de encomenda

```
Pendente → Pago → Enviado → Entregue
                ↘ Cancelado
```

Configurados em `ORDER_STATUSES` e geridos pelo painel de administração.

### Peso padrão dos artigos

Quando um produto não tem peso definido, é assumido **0,4 kg** (peso típico de uma peça de vestuário).

---

## 10. Políticas

### Política de devolução (`/politica-devolucao`)

- **Prazo:** 14 dias após receção (configurado em `RETURN_POLICY_DAYS: 14`)
- **Condições:** Artigo com etiqueta, sem uso, na embalagem original
- **Processo:** Contacto por email para obter autorização e guia de devolução
- **Custos:** Portes de devolução a cargo do cliente, salvo defeito de fabrico

### RGPD — Privacidade e cookies (`/politica-privacidade`)

**Componente `MarketingConsent.tsx`** implementa:

- **Banner de cookies** (slide-up inferior) ao primeiro acesso — apresenta opções de Aceitar / Rejeitar / Gerir preferências
- **Modal de preferências granulares** com quatro categorias:
  - Obrigatórios (sempre ativos)
  - Personalização (opt-in)
  - Marketing (opt-in)
  - Analítica (opt-in)
- **Persistência** em `localStorage` (`recicloth_cookie_consent` + `recicloth_cookie_preferences`)
- **Evento personalizado** `recicloth:cookie-consent-changed` — permite que outros componentes (ex: Analytics) reajam à mudança de consentimento
- O **Google Analytics** só é ativado após consentimento explícito (`analytics_storage: 'granted'`)
- Página de política de privacidade completa com informação sobre responsável pelo tratamento, dados recolhidos, direitos do titular e contacto do DPO

### Termos e Condições (`/termos-condicoes`)

- Regras de utilização da plataforma
- Condições de compra e aceitação do contrato
- Limitação de responsabilidade
- Lei aplicável (Portugal / UE)

---

## 11. Integrações

### Google Analytics 4

- **Como:** tag `gtag.js` injetada no `index.html`; `AnalyticsTracker.tsx` envia `page_view` em cada mudança de rota
- **Consentimento:** só ativa após o utilizador aceitar cookies de analítica (`MarketingConsent`)
- **Configuração:** `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` no `.env`

### Stripe — Pagamentos

- **Como:** `@stripe/react-stripe-js` no frontend (Stripe Elements); `stripe` SDK no backend
- **Fluxo:** frontend cria PaymentIntent → backend confirma via webhook → encomenda criada
- **Segurança:** assinatura do webhook verificada com `STRIPE_WEBHOOK_SECRET`

### Resend — Email transacional

Emails enviados pelo sistema:

| Trigger | Destinatário | Conteúdo |
|---------|-------------|---------|
| Encomenda confirmada | Cliente | Resumo da encomenda, imagens dos produtos, custo de envio |
| Registo de conta | Cliente | Link de verificação de email |
| Recuperação de password | Cliente | Link de reset |
| OTP de convidado | Cliente | Código de 6 dígitos (válido 10 min) |
| Formulário de contacto | `general@recicloth.com` | Mensagem do cliente com `replyTo` |

### Google OAuth

- Autenticação social com um clique via `@react-oauth/google`
- Fluxo de callback em `/api/auth/google`
- Criação automática de conta ou ligação a conta existente

### GeoIP

- Deteção automática do país do visitante via `geoip-lite`
- Pré-seleciona o país no formulário de checkout
- Endpoint: `/api/geo`

---

## 12. Testes realizados

### Simulação de compra completa

**Cenário 1 — Utilizador autenticado:**
1. Navegar para a loja (`/loja`)
2. Filtrar por categoria, cor ou tamanho
3. Clicar num produto → selecionar cor e tamanho
4. Adicionar ao carrinho → verificar toast de confirmação e contador na navbar
5. Ir ao carrinho → verificar itens, quantidades e total
6. Avançar para checkout → preencher morada de entrega (país UE)
7. Verificar cálculo automático de portes (PT: a partir de €1,58; EU: a partir de €2,65)
8. Preencher dados de cartão Stripe (cartão de teste: `4242 4242 4242 4242`)
9. Confirmar pagamento → verificar redirecionamento para `/checkout/success`
10. Verificar email de confirmação recebido com imagens e portes
11. Verificar no painel admin que a encomenda aparece com estado **Pago**

**Cenário 2 — Convidado:**
1. Mesmo fluxo sem login
2. No checkout, introduzir email + confirmação de email
3. Receber e introduzir código OTP
4. Concluir pagamento normalmente

**Cenário 3 — Filtros da loja:**
1. Abrir filtros no mobile (bottom sheet)
2. Selecionar cor → verificar swatches com hex correto
3. Aplicar filtro → verificar que a grelha de produtos é atualizada

**Cenário 4 — Painel de administração:**
1. Login com conta admin em `/admin`
2. Criar produto com estado, material, tipo, imagens e variantes de stock
3. Atualizar estado de encomenda de Pago → Enviado
4. Verificar que email de envio é disparado

### Resultados

| Teste | Resultado |
|-------|-----------|
| Compra autenticada de ponta a ponta | Passou |
| Compra como convidado com OTP | Passou |
| Email de confirmação com imagem e portes | Passou |
| Filtros de cor (mobile e desktop) | Passou |
| Cálculo de portes PT vs UE | Passou |
| Consentimento de cookies (aceitar/rejeitar/gerir) | Passou |
| Analytics só ativo após consentimento | Passou |
| Formulário de contacto → email recebido | Passou |
| Painel admin — CRUD produtos | Passou |
| Painel admin — atualização de estados | Passou |
| Troca de língua PT ↔ EN (mobile e desktop) | Passou |
| Redirect de rotas SPA no Vercel | Passou |

---

## 13. Limitações e o que não foi implementado

| Funcionalidade | Estado | Nota |
|----------------|--------|------|
| Pagamento por transferência bancária | Não implementado | Apenas Stripe (cartão e mbway) Seria só habilitar no Stripe e moldar o backend para funcionar com este pagamento|
| Plugin de envio automático (ex: CTT API) | Não implementado | Tarifas CTT configuradas manualmente Requer Contrato como Empresa |
| Faturação / PDF de fatura automático | Parcial | Componente `Invoice.tsx` existe mas não é gerado automaticamente |
| Gestão de devoluções no painel admin | Não implementado | Política publicada; processo manual por email |
| Programa de fidelização / pontos | Não implementado | — |
| Newsletter (backend) | Parcial | Modal de subscrição existe; envio de newsletters não implementado |

---

## Estrutura do repositório

```
recicloth/
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── admin/             # Painel de administração
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── context/           # Contextos React (Language, Auth, Cart)
│   │   ├── hooks/             # Hooks personalizados
│   │   ├── locales/           # Traduções (pt.json, en.json)
│   │   ├── pages/             # Páginas da loja
│   │   ├── types/             # Tipos TypeScript
│   │   └── utils/             # Utilitários (rotas, SEO, schemas)
│   └── vite.config.ts
├── backend/
│   └── src/
│       ├── config/            # businessRules.ts, database.ts
│       ├── middleware/        # Auth, error handler
│       ├── routes/            # Endpoints da API
│       ├── models/            # Acesso à base de dados
│       └── emailService.ts    # Templates e envio de email
├── api/
│   └── index.ts               # Entry point serverless Vercel
├── db.sql                     # Schema e dados iniciais
├── migrations/                # Migrações de base de dados
└── vercel.json                # Configuração de deployment
```
