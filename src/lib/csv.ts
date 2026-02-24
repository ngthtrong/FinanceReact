// Header constants used for CSV export.
// CSV files in data/ are read-only reference files used by migration scripts only.
// The application reads from and writes to PostgreSQL exclusively.
// CSV import/export is handled via /api/export (download) and dedicated import endpoints.

export const TRANSACTION_HEADERS = [
  "id", "date", "title", "amount", "transaction_type",
  "category", "category_group", "special_tag", "budget_impact",
  "year", "month", "day_of_week",
];

export const LOAN_HEADERS = [
  "loan_id", "title", "amount", "date", "loan_type",
  "status", "counterparty", "related_tags", "original_category",
  "year", "month",
];

export const CATEGORY_HEADERS = [
  "abbreviation", "full_name", "english_name", "category_type", "group",
];

export const PAYMENT_HEADERS = [
  "payment_id", "loan_id", "amount", "date", "note",
];
