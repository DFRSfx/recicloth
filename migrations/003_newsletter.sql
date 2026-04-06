-- Migration: 003_newsletter.sql
-- Description: Newsletter subscribers and campaigns tables
-- Date: 2026-04-06

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

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email   ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active  ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token   ON newsletter_subscribers(unsubscribe_token);

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
