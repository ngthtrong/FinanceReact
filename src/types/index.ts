export interface Transaction {
  id: number;
  date: string;
  title: string;
  amount: number;
  transaction_type: "income" | "expense";
  category: string;
  category_group: string;
  special_tag: string;
  budget_impact: number;
  year: number;
  month: number;
  day_of_week: string;
}

export interface Category {
  abbreviation: string;
  full_name: string;
  english_name: string;
  category_type: "income" | "expense";
  group: string;
}

export interface Loan {
  loan_id: number;
  title: string;
  amount: number;
  date: string;
  loan_type: "borrowing" | "lending";
  status: "outstanding" | "partial" | "paid";
  counterparty: string;
  related_tags: string;
  original_category: string;
  year: number;
  month: number;
}

export interface TransactionCreateInput {
  date: string;
  title: string;
  amount: number;
  transaction_type: "income" | "expense";
  category: string;
  category_group: string;
  special_tag?: string;
}

export interface LoanCreateInput {
  title: string;
  amount: number;
  date: string;
  loan_type: "borrowing" | "lending";
  counterparty: string;
  related_tags?: string;
  original_category: string;
}

export interface TransactionFilters {
  search?: string;
  transaction_type?: "income" | "expense" | "all";
  category?: string;
  category_group?: string;
  special_tag?: string;
  date_from?: string;
  date_to?: string;
  year?: number;
  month?: number;
  amount_min?: number;
  amount_max?: number;
  sort_by?: "date" | "amount" | "category" | "title" | "category_group" | "transaction_type";
  sort_order?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface LoanFilters {
  loan_type?: "borrowing" | "lending" | "all";
  status?: "outstanding" | "partial" | "paid" | "all";
  counterparty?: string;
  search?: string;
}

export interface DashboardData {
  summary: CashFlowSummary;
  currentBalance: number;
  healthScore: HealthScore;
  spendingByCategory: CategorySpending[];
  spendingByGroup: GroupSpending[];
  monthlyTrend: MonthlyTrend[];
  recentTransactions: Transaction[];
  warnings: SpendingWarning[];
  loanSummary: LoanSummary;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number;
  totalIncomeExcludingBig: number;
  totalExpenseExcludingBig: number;
  netCashFlowExcludingBig: number;
  period: string;
}

export interface HealthScore {
  overall: number;
  savingsRatio: number;
  expenseDiversity: number;
  essentialRatio: number;
  debtBurden: number;
  consistency: number;
  breakdown: HealthBreakdownItem[];
}

export interface HealthBreakdownItem {
  label: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface CategorySpending {
  category: string;
  group: string;
  total: number;
  percentage: number;
  count: number;
}

export interface GroupSpending {
  group: string;
  total: number;
  percentage: number;
  categories: CategorySpending[];
}

export interface MonthlyTrend {
  year: number;
  month: number;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface SpendingWarning {
  id: string;
  severity: "info" | "warning" | "critical";
  type: string;
  title: string;
  message: string;
  category?: string;
  currentAmount: number;
  thresholdAmount: number;
  percentageOver: number;
}

export interface LoanSummary {
  totalBorrowing: number;
  totalLending: number;
  outstandingBorrowing: number;
  outstandingLending: number;
  netDebt: number;
  borrowingCount: number;
  lendingCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Settings types
export interface SavingsGoal {
  monthlyTarget: number;
  yearlyTarget: number;
  notes: string;
}

export interface CategoryLimit {
  weekly?: number;
  monthly?: number;
  yearly?: number;
}

export interface AppSettings {
  savingsGoals: SavingsGoal;
  categoryLimits: Record<string, CategoryLimit>;
  totalLimits?: {
    weeklyTotal?: number;
    monthlyTotal?: number;
  };
}

// Payment types
export interface Payment {
  payment_id: number;
  loan_id: number;
  amount: number;
  date: string;
  note: string;
}

export interface PaymentCreateInput {
  amount: number;
  date: string;
  note?: string;
}

export interface LoanWithPayments extends Loan {
  paid_amount: number;
  remaining_amount: number;
  payment_percentage: number;
}
