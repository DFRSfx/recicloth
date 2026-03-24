You are a senior full-stack developer. I have an existing e-commerce project at https://github.com/DFRSfx/recicloth built with React + Node.js (TypeScript) + MySQL. I need you to fully migrate and adapt it into a recycled clothing e-commerce store called "Recicloth" with the following scope:

---

## PART 1 — DATABASE MIGRATION: MySQL → PostgreSQL (Supabase)

The current backend uses `mysql2/promise` with a connection pool in `backend/src/config/database.ts`. Replace the entire database layer with PostgreSQL using the `pg` package.

### New DB credentials (use via environment variables):
**Option A – Direct connection (use if IPv6 works):**
- DB_HOST=db.orekmrlxkpuymngiphzf.supabase.co
- DB_PORT=5432
- DB_NAME=postgres
- DB_USER=postgres

**Option B – Session Pooler (recommended for IPv4 networks):**
- DB_HOST=aws-1-eu-west-1.pooler.supabase.com
- DB_PORT=5432
- DB_NAME=postgres
- DB_USER=postgres.orekmrlxkpuymngiphzf

### Migration tasks:
1. Replace `mysql2/promise` with `pg` (node-postgres) — install `pg` and `@types/pg`, remove `mysql2`.
2. Rewrite `backend/src/config/database.ts` to use a `pg.Pool` instead of `mysql2` pool.
3. Update ALL SQL queries across all route files to PostgreSQL syntax:
   - Replace all `?` placeholders with `$1, $2, $3...` (positional params)
   - Replace `INSERT INTO ... SET ?` with explicit column/value syntax
   - Replace MySQL `AUTO_INCREMENT` with PostgreSQL `SERIAL` or `BIGSERIAL`
   - Replace backtick identifiers `` ` `` with double quotes `"` where needed
   - Replace `LAST_INSERT_ID()` with `RETURNING id`
   - Replace `NOW()` — already compatible, keep as is
   - Replace any `TINYINT(1)` booleans with `BOOLEAN`
   - Replace `ENUM(...)` with `VARCHAR` + CHECK constraints or PostgreSQL native ENUM
4. Rewrite `db.sql` — convert the full MySQL schema to valid PostgreSQL DDL (CREATE TABLE statements with proper types, constraints, sequences).
5. Update `.env.example` to reflect the new PostgreSQL variables (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) and remove the old MySQL ones.
6. Add SSL support for Supabase: in the pg Pool config, set `ssl: { rejectUnauthorized: false }` when NODE_ENV is production.

---

## PART 2 — THEME & BRANDING ADAPTATION: "Recicloth"

Adapt the entire frontend visual identity for a recycled clothing store:

1. **Store name**: "Recicloth"
2. **Tagline**: "Moda que respeita o planeta"
3. **Color palette**: earthy/sustainable tones — forest green (#2D6A4F), warm beige (#F2E8DC), off-white (#FAFAF8), dark charcoal (#1A1A1A) for text
4. **Typography**: Use Google Fonts — "Playfair Display" for headings, "Inter" for body
5. **Logo**: Text-based SVG logo with a recycling motif integrated into the "o" of Recicloth
6. Update all references to the old store name ("Arte em Ponto" or any other) to "Recicloth" across all frontend and backend files including email templates in `emailService.ts`

---

## PART 3 — PRODUCT CATALOG (minimum 10 products)

Seed the database with at least 10 recycled clothing products. Each product must have:
- `name` (string)
- `price` (decimal, in EUR)
- `description` (text) — including: Estado (e.g., "Bom estado"), Material (e.g., "100% algodão orgânico"), Tipo (e.g., "Reciclado" | "Upcycled" | "Segunda-mão")
- `stock` (integer, preferably 1)
- `category_id` (mapped to categories below)
- `images` (use placeholder URLs from https://picsum.photos/ or similar until real images are added)

### Categories to create:
- Homem
- Mulher
- Acessórios
- Upcycled

Create a seed SQL file `backend/src/database/seed.sql` with INSERT statements for all 10+ products and their categories.

---

## PART 4 — BUSINESS RULES & PARAMETRIZATION

Add or update a business configuration module at `backend/src/config/businessRules.ts`:

```typescript
export const BUSINESS_RULES = {
  VAT_RATE: 0.23, // 23% IVA
  FREE_SHIPPING_THRESHOLD: 75, // free shipping above €75
  SHIPPING: {
    PT: { cost: 3.99, days: "2-3 dias úteis" },
    EU: { cost: 8.99, days: "5-10 dias úteis" },
    ELIGIBLE_COUNTRIES: [
      "PT","ES","FR","DE","IT","NL","BE","AT","PL","SE","DK","FI",
      "IE","GR","CZ","RO","HU","SK","BG","HR","SI","LT","LV","EE",
      "CY","LU","MT"
    ]
  },
  ORDER_STATUSES: ["Pendente", "Pago", "Enviado", "Entregue", "Cancelado"],
  RETURN_POLICY_DAYS: 14,
  CURRENCY: "EUR"
};


Apply VAT_RATE to the order total calculation in backend/src/routes/orders.ts and expose it in the checkout API response. Apply shipping costs in backend/src/routes/orders.ts based on the delivery country, rejecting non-EU countries with a 400 error and message "Apenas entregamos na União Europeia."

PART 5 — MISSING FEATURES TO IMPLEMENT
5.1 Cart (verify/complete backend/src/routes/cart.ts):
GET /api/cart — get current user's cart with product details and calculated subtotal

POST /api/cart — add product (check stock availability, reject if stock = 0)

PUT /api/cart/:itemId — update quantity

DELETE /api/cart/:itemId — remove item

Recalculate total on every response, applying VAT from BUSINESS_RULES

5.2 Checkout flow (verify/complete backend/src/routes/orders.ts):
Validate delivery country is in EU eligible list

Calculate: subtotal + VAT (23%) + shipping cost based on country

Supported payment methods: "Transferência Bancária" (simulated), "MBWay" (existing Eupago integration)

Create order with status "Pendente" by default

On order creation, send confirmation email via emailService.ts

5.3 Order statuses:
Ensure the orders table and API support all statuses: Pendente → Pago → Enviado → Entregue (+ Cancelado). Add a PATCH /api/orders/:id/status endpoint (admin only) to update order status.

5.4 Legal pages (Frontend):
Create the following React pages/components:

frontend/src/pages/PoliticaPrivacidade.tsx — GDPR privacy policy in Portuguese

frontend/src/pages/PoliticaDevolucao.tsx — 14-day return policy in Portuguese

frontend/src/pages/TermosCondicoes.tsx — Terms & conditions in Portuguese

frontend/src/components/CookieBanner.tsx — GDPR cookie consent banner that saves preference to localStorage

Add routes for all legal pages in the React Router config.

5.5 Cookie & GDPR consent:
The CookieBanner must appear on first visit and offer "Aceitar" / "Rejeitar" options. If accepted, set a localStorage key recicloth_cookie_consent=true.

PART 6 — GOOGLE ANALYTICS INTEGRATION
Add Google Analytics 4 (GA4) to the frontend:

Install react-ga4 or use the gtag script approach

Add a placeholder Measurement ID: G-XXXXXXXXXX (document this as needing replacement)

Track page views on React Router navigation changes

Only initialize GA4 if cookie consent has been accepted (recicloth_cookie_consent === 'true')

PART 7 — UPDATED .env
Produce a complete updated backend/.env with all variables documented:

text
PORT=3001
NODE_ENV=development

# PostgreSQL / Supabase
DB_HOST=aws-1-eu-west-1.pooler.supabase.com
DB_PORT=5432
DB_USER=postgres.orekmrlxkpuymngiphzf
DB_PASSWORD=your_supabase_password
DB_NAME=postgres

# JWT
JWT_SECRET=generate_with_crypto_randomBytes_64
JWT_EXPIRES_IN=7d

# Email (SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@recicloth.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM_NAME=Recicloth

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
DELIVERABLES EXPECTED
For every change, provide:

The complete updated file content (not just diffs)

Any new files created

Shell commands needed (npm install, etc.)

The complete backend/src/database/seed.sql with all products

The complete PostgreSQL schema (db.sql rewritten for PostgreSQL)

Start with: (1) database.ts migration, (2) db.sql schema conversion, (3) all route files SQL query migration, then proceed to frontend changes.

text

***

Esta prompt cobre tudo o que o teu guião pede : migração MySQL→PostgreSQL, IVA 23%, portes UE, estados de encomenda, RGPD, cookies, devoluções 14 dias, catálogo mínimo de 10 produtos, categorias, e Google Analytics. O agente terá contexto suficiente do código existente para não reescrever do zero o que já funciona.
