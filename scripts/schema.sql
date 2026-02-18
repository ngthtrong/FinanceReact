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
