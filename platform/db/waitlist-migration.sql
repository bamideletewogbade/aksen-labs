CREATE TABLE IF NOT EXISTS product_waitlist (
 id text PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 product_slug text NOT NULL, email text NOT NULL, hoped_for text,
 source text NOT NULL DEFAULT 'products_page',
 CONSTRAINT product_waitlist_product_email UNIQUE (product_slug, email)
);
CREATE INDEX IF NOT EXISTS idx_product_waitlist_created ON product_waitlist(product_slug, created_at)
