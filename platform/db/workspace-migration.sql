CREATE TABLE IF NOT EXISTS business_workspaces (
 id text PRIMARY KEY, owner_id text NOT NULL, name text NOT NULL,
 stage text NOT NULL DEFAULT 'prospect', currency text NOT NULL DEFAULT 'NGN',
 context text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_workspaces_owner ON business_workspaces(owner_id, created_at);
CREATE TABLE IF NOT EXISTS business_documents (
 id text PRIMARY KEY, business_id text NOT NULL REFERENCES business_workspaces(id),
 project_id text REFERENCES projects(id), title text NOT NULL, kind text NOT NULL,
 content text NOT NULL DEFAULT '', evidence_status text NOT NULL DEFAULT 'unverified',
 filename text, file_base64 text, mime_type text, source_ids jsonb NOT NULL DEFAULT '[]',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_documents_business ON business_documents(business_id, created_at);
CREATE TABLE IF NOT EXISTS business_financials (
 id text PRIMARY KEY, business_id text NOT NULL REFERENCES business_workspaces(id),
 project_id text REFERENCES projects(id), kind text NOT NULL CHECK(kind IN ('proforma','invoice','receipt')),
 number text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','issued','paid','void')),
 currency text NOT NULL CHECK(currency IN ('NGN','GHS','USD','GBP','EUR')),
 total_minor integer NOT NULL CHECK(total_minor > 0), paid_minor integer NOT NULL DEFAULT 0 CHECK(paid_minor >= 0 AND paid_minor <= total_minor),
 details jsonb NOT NULL, invoice_id text REFERENCES business_financials(id),
 payment_reference text, issued_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(invoice_id, payment_reference)
);
CREATE INDEX IF NOT EXISTS business_financials_business ON business_financials(business_id, created_at);
CREATE TABLE IF NOT EXISTS workspace_demo_usage (bucket text PRIMARY KEY, requests integer NOT NULL CHECK(requests > 0));
