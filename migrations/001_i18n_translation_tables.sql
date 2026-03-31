-- Migration: 001_i18n_translation_tables.sql
-- Description: Adds product, color, and category translation tables for PT/EN i18n support
-- Date: 2026-03-31
-- Author: Recicloth Team

-- ── Traduções de produtos ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_translations (
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lang        CHAR(2) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (product_id, lang)
);

-- ── Traduções de cores (nomes dentro do JSONB colors) ─────────────────────────
CREATE TABLE IF NOT EXISTS color_translations (
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  hex         VARCHAR(10) NOT NULL,
  lang        CHAR(2) NOT NULL,
  name        VARCHAR(80) NOT NULL,
  PRIMARY KEY (product_id, hex, lang)
);

-- ── Traduções de categorias ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS category_translations (
  category_id  BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  lang         CHAR(2) NOT NULL,
  name         VARCHAR(50) NOT NULL,
  description  VARCHAR(500),
  PRIMARY KEY (category_id, lang)
);

-- ── Índices ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_translations_lang    ON product_translations(lang);
CREATE INDEX IF NOT EXISTS idx_color_translations_lang      ON color_translations(lang);
CREATE INDEX IF NOT EXISTS idx_category_translations_lang   ON category_translations(lang);

-- ── Rollback (run manually if needed) ────────────────────────────────────────
-- DROP TABLE IF EXISTS product_translations;
-- DROP TABLE IF EXISTS color_translations;
-- DROP TABLE IF EXISTS category_translations;
