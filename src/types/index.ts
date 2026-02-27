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
  totalAmount?: number;
  totalIncome?: number;
  totalExpense?: number;
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

// Planned transaction types
export type PlannedRecurrence = "once" | "monthly" | "yearly";

export interface PlannedTransaction {
  id: number;
  title: string;
  amount: number;
  planned_date: string; // YYYY-MM-DD
  type: "income" | "expense";
  category: string;
  recurrence: PlannedRecurrence;
  is_active: boolean;
  note: string;
  created_at: string;
}

export interface PlannedTransactionCreateInput {
  title: string;
  amount: number;
  planned_date: string;
  type: "income" | "expense";
  category?: string;
  recurrence: PlannedRecurrence;
  note?: string;
}

export interface FutureBalanceLineItem {
  title: string;
  amount: number;
  category: string;
}

export interface FutureBalancePoint {
  label: string;       // "T1/2026"
  year: number;
  month: number;
  income: number;      // planned income that month
  expense: number;     // planned expense that month
  net: number;         // income - expense
  balance: number;     // running cumulative balance
  incomeItems: FutureBalanceLineItem[];
  expenseItems: FutureBalanceLineItem[];
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

// ── Monthly Report Types ──

/** Full monthly end-of-month report */
export interface MonthlyReport {
  year: number;
  month: number;
  period: string;
  summary: MonthlyReportSummary;
  weeklyComparison: WeeklyComparison[];
  largeExpenses: LargeExpense[];
  overBudgetCategories: OverBudgetCategory[];
  anomalies: SpendingAnomaly[];
  categoryTrends: CategoryTrend[];
  improvementSuggestions: ImprovementSuggestion[];
  savingsAnalysis: SavingsAnalysis;
}

export interface MonthlyReportSummary {
  totalIncome: number;
  totalExpense: number;
  totalExpenseExBig: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
  avgDailyExpense: number;
  daysInMonth: number;
  vsLastMonth: {
    expenseChange: number;
    expenseChangePercent: number;
    incomeChange: number;
    incomeChangePercent: number;
    savingsRateChange: number;
  };
}

export interface WeeklyComparison {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalExpense: number;
  totalIncome: number;
  topCategory: string;
  topCategoryAmount: number;
  transactionCount: number;
  avgDaily: number;
  vsWeeklyBudget: number; // % over/under weekly budget
}

export interface LargeExpense {
  id: number;
  date: string;
  title: string;
  amount: number;
  category: string;
  category_group: string;
  percentOfMonthly: number;
  isAnomalous: boolean;
  reason: string;
}

export interface OverBudgetCategory {
  category: string;
  group: string;
  spent: number;
  weeklyLimit: number;
  monthlyLimit: number;
  monthlyOverAmount: number;
  monthlyOverPercent: number;
  weeklyOverAmount: number;
  weeklyOverPercent: number;
  severity: "warning" | "critical";
}

export interface SpendingAnomaly {
  category: string;
  currentAmount: number;
  avgAmount: number;
  stdDev: number;
  zScore: number;
  changePercent: number;
  severity: "mild" | "moderate" | "severe";
  description: string;
}

export interface CategoryTrend {
  category: string;
  group: string;
  months: { month: number; year: number; amount: number }[];
  currentMonth: number;
  avgLast3: number;
  avgLast6: number;
  trend: "increasing" | "decreasing" | "stable";
  trendPercent: number;
}

export interface ImprovementSuggestion {
  id: string;
  priority: "high" | "medium" | "low";
  icon: string;
  title: string;
  description: string;
  potentialSaving: number;
  actionItems: string[];
}

export interface SavingsAnalysis {
  currentSavingsRate: number;
  targetSavingsRate: number;
  monthlyTarget: number;
  actualSaved: number;
  gap: number;
  projectedYearly: number;
  bestMonth: { month: number; rate: number };
  worstMonth: { month: number; rate: number };
}
