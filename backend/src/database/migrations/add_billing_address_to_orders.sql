  -- Migration: add_billing_address_to_orders.sql
  -- Adds billing address columns to the orders table.
  -- Billing defaults to NULL — backend fills it from shipping when billingSameAsShipping=true.

  ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS billing_name        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS billing_address     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS billing_city        VARCHAR(60),
    ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(10);
