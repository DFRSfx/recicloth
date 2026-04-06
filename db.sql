-- PostgreSQL schema for Recicloth
-- Compatible with Supabase PostgreSQL
-- Auto-generated: 2026-03-31T16:00:10.420Z

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'suspended');

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  google_id VARCHAR(255),
  avatar_url TEXT,
  password VARCHAR(255) NOT NULL DEFAULT '',
  name VARCHAR(100) NOT NULL,
  n_telemovel VARCHAR(20),
  role user_role NOT NULL DEFAULT 'customer',
  status user_status NOT NULL DEFAULT 'active',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(email),
  UNIQUE(google_id),
  CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('customer'::character varying)::text, ('admin'::character varying)::text])))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users USING btree (status);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(60) NOT NULL,
  description VARCHAR(500),
  image VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(name),
  UNIQUE(slug)
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  colors JSONB,
  images JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  size_stock JSONB,
  stock_mode VARCHAR(20) NOT NULL DEFAULT 'unit',
  weight INTEGER,
  CONSTRAINT products_price_check CHECK ((price >= (0)::numeric)),
  CONSTRAINT products_stock_check CHECK ((stock >= 0)),
  CONSTRAINT products_weight_check CHECK ((weight > 0))
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON public.products USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products USING btree (featured);
CREATE INDEX IF NOT EXISTS idx_products_featured_created_at ON public.products USING btree (featured, created_at DESC) WHERE (featured = true);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products USING btree (price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products USING btree (stock);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0))
);

CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON public.cart_items USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id_created_at ON public.cart_items USING btree (user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS unique_cart_session_product ON public.cart_items USING btree (session_id, product_id) WHERE (session_id IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS unique_cart_user_product ON public.cart_items USING btree (user_id, product_id) WHERE (user_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS category_translations (
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  lang CHAR(2) NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  PRIMARY KEY (category_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_category_translations_lang ON public.category_translations USING btree (lang);

CREATE TABLE IF NOT EXISTS color_translations (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  hex VARCHAR(10) NOT NULL,
  lang CHAR(2) NOT NULL,
  name VARCHAR(80) NOT NULL,
  PRIMARY KEY (product_id, hex, lang)
);

CREATE INDEX IF NOT EXISTS idx_color_translations_lang ON public.color_translations USING btree (lang);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(token)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens USING btree (user_id);

CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_session_id ON public.favorites USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_fav_session_product ON public.favorites USING btree (session_id, product_id) WHERE (session_id IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS unique_fav_user_product ON public.favorites USING btree (user_id, product_id) WHERE (user_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS hero_slides (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  button_text VARCHAR(100) NOT NULL,
  button_link VARCHAR(255) NOT NULL,
  text_color VARCHAR(10) NOT NULL DEFAULT 'white',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT hero_slides_text_color_check CHECK (((text_color)::text = ANY ((ARRAY['white'::character varying, 'dark'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  tracking_token VARCHAR(64),
  user_id BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address VARCHAR(200) NOT NULL,
  customer_city VARCHAR(60) NOT NULL,
  customer_postal_code VARCHAR(10) NOT NULL,
  delivery_country VARCHAR(2) NOT NULL DEFAULT 'PT',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(50),
  payment_entity VARCHAR(10),
  payment_intent_id VARCHAR(128),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tracking_token),
  CONSTRAINT orders_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'expired'::character varying])::text[]))),
  CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[]))),
  CONSTRAINT orders_total_check CHECK ((total >= (0)::numeric))
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders USING btree (tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON public.orders USING btree (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON UPDATE CASCADE,
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  CONSTRAINT order_items_price_check CHECK ((price >= (0)::numeric)),
  CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id_quantity ON public.order_items USING btree (product_id, quantity);

CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  reviewer_name VARCHAR(100) NOT NULL,
  reviewer_email VARCHAR(100) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  headline VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  size VARCHAR(20),
  color VARCHAR(50),
  fit VARCHAR(50),
  height VARCHAR(50),
  likelihood VARCHAR(20),
  activities TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  moderated_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  moderated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(order_item_id),
  CONSTRAINT product_reviews_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON public.product_reviews USING btree (status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews USING btree (user_id);

CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  email VARCHAR(255) NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  blocked_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(ip_address, email)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);

CREATE TABLE IF NOT EXISTS pending_checkouts (
  payment_intent_id VARCHAR(128) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (payment_intent_id)
);

CREATE TABLE IF NOT EXISTS product_translations (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lang CHAR(2) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (product_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_product_translations_lang ON public.product_translations USING btree (lang);

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(200) NOT NULL,
  city VARCHAR(60) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_default ON public.shipping_addresses USING btree (user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON public.shipping_addresses USING btree (user_id);

-- ── Newsletter subscribers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id                SERIAL PRIMARY KEY,
  email             VARCHAR(255) NOT NULL UNIQUE,
  user_id           INT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  subscribed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at   TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email  ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token  ON newsletter_subscribers(unsubscribe_token);

-- ── Newsletter campaigns ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id           SERIAL PRIMARY KEY,
  subject      VARCHAR(255) NOT NULL,
  content_html TEXT NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  sent_at      TIMESTAMPTZ NULL,
  sent_count   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
