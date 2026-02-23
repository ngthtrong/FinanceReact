-- Schema for Finance App (Neon / Vercel Postgres)

CREATE TABLE IF NOT EXISTS categories (
  abbreviation    TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  english_name    TEXT NOT NULL DEFAULT '',
  category_type   TEXT NOT NULL CHECK (category_type IN ('income', 'expense')),
  "group"         TEXT NOT NULL,
  PRIMARY KEY (abbreviation, category_type)
);

CREATE TABLE IF NOT EXISTS transactions (
  id                SERIAL PRIMARY KEY,
  date              DATE NOT NULL,
  title             TEXT NOT NULL,
  amount            BIGINT NOT NULL,
  transaction_type  TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category          TEXT NOT NULL,
  category_group    TEXT NOT NULL,
  special_tag       TEXT NOT NULL DEFAULT '',
  budget_impact     BIGINT NOT NULL,
  year              INT NOT NULL,
  month             INT NOT NULL,
  day_of_week       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_year_month ON transactions(year, month);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

CREATE TABLE IF NOT EXISTS loans (
  loan_id           SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  amount            BIGINT NOT NULL,
  date              DATE NOT NULL,
  loan_type         TEXT NOT NULL CHECK (loan_type IN ('borrowing', 'lending')),
  status            TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'partial', 'paid')),
  counterparty      TEXT NOT NULL,
  related_tags      TEXT NOT NULL DEFAULT '',
  original_category TEXT NOT NULL,
  year              INT NOT NULL,
  month             INT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id  SERIAL PRIMARY KEY,
  loan_id     INT NOT NULL REFERENCES loans(loan_id) ON DELETE CASCADE,
  amount      BIGINT NOT NULL,
  date        DATE NOT NULL,
  note        TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);

-- Single-row table to persist manual cash/bank balances across devices
CREATE TABLE IF NOT EXISTS balance_config (
  id    INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cash  BIGINT NOT NULL DEFAULT 0,
  bank  BIGINT NOT NULL DEFAULT 0
);

-- Ensure the single row always exists
INSERT INTO balance_config (id, cash, bank) VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Planned income / expense items (future projections)
CREATE TABLE IF NOT EXISTS planned_transactions (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  amount        BIGINT NOT NULL,
  planned_date  DATE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category      TEXT NOT NULL DEFAULT '',
  recurrence    TEXT NOT NULL DEFAULT 'once' CHECK (recurrence IN ('once', 'monthly', 'yearly')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  note          TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planned_date ON planned_transactions(planned_date);
CREATE INDEX IF NOT EXISTS idx_planned_type ON planned_transactions(type);
