import { Transaction, Loan, HealthScore, HealthBreakdownItem } from "@/types";
import { ESSENTIAL_GROUPS } from "./constants";

export function calculateHealthScore(
  transactions: Transaction[],
  loans: Loan[],
  monthsBack: number = 6,
  paidMap: Record<number, number> = {}
): HealthScore {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const recent = transactions.filter(
    (t) => new Date(t.date) >= cutoff && t.special_tag !== "BigY"
  );

  const s1 = scoreSavings(recent);
  const s2 = scoreDiversity(recent);
  const s3 = scoreEssentials(recent);
  const s4 = scoreDebt(loans, recent, paidMap);
  const s5 = scoreConsistency(recent, monthsBack);

  const breakdown: HealthBreakdownItem[] = [
    { label: "Tiết kiệm", score: s1, maxScore: 20, description: descSavings(s1) },
    { label: "Đa dạng chi tiêu", score: s2, maxScore: 20, description: descDiversity(s2) },
    { label: "Thiết yếu vs Tùy ý", score: s3, maxScore: 20, description: descEssentials(s3) },
    { label: "Gánh nặng nợ", score: s4, maxScore: 20, description: descDebt(s4) },
    { label: "Ổn định chi tiêu", score: s5, maxScore: 20, description: descConsistency(s5) },
  ];

  return {
    overall: s1 + s2 + s3 + s4 + s5,
    savingsRatio: s1,
    expenseDiversity: s2,
    essentialRatio: s3,
    debtBurden: s4,
    consistency: s5,
    breakdown,
  };
}

function scoreSavings(transactions: Transaction[]): number {
  const income = transactions
    .filter((t) => t.transaction_type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.transaction_type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  if (income === 0) return 4;
  const ratio = ((income - expense) / income) * 100;

  if (ratio >= 30) return 20;
  if (ratio >= 20) return 16;
  if (ratio >= 10) return 12;
  if (ratio >= 0) return 8;
  return Math.max(0, Math.round(8 + (ratio / 10) * 8));
}

function scoreDiversity(transactions: Transaction[]): number {
  const expenses = transactions.filter((t) => t.transaction_type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  if (total === 0) return 20;

  const byCategory: Record<string, number> = {};
  expenses.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const hhi = Object.values(byCategory).reduce((sum, val) => {
    const share = val / total;
    return sum + share * share;
  }, 0);

  if (hhi < 0.15) return 20;
  if (hhi < 0.25) return 15;
  if (hhi < 0.4) return 10;
  if (hhi < 0.6) return 5;
  return 0;
}

function scoreEssentials(transactions: Transaction[]): number {
  const expenses = transactions.filter((t) => t.transaction_type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  if (total === 0) return 15;

  const essential = expenses
    .filter((t) => ESSENTIAL_GROUPS.includes(t.category_group))
    .reduce((s, t) => s + t.amount, 0);
  const ratio = (essential / total) * 100;

  if (ratio >= 50 && ratio <= 70) return 20;
  if (ratio >= 40 && ratio < 50) return 15;
  if (ratio > 70 && ratio <= 80) return 15;
  if (ratio < 40 || ratio > 80) return 10;
  return 5;
}

function scoreDebt(loans: Loan[], transactions: Transaction[], paidMap: Record<number, number> = {}): number {
  const personalDebt = loans
    .filter(
      (l) =>
        l.loan_type === "borrowing" &&
        l.status !== "paid" &&
        !l.related_tags?.includes("BigY")
    )
    .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0);

  const lending = loans
    .filter((l) => l.loan_type === "lending" && l.status !== "paid")
    .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0);

  const incomes = transactions
    .filter((t) => t.transaction_type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const months = new Set(transactions.map((t) => `${t.year}-${t.month}`)).size || 1;
  const monthlyIncome = incomes / months;
  const annualIncome = monthlyIncome * 12;

  if (annualIncome === 0) return 8;
  const ratio = personalDebt / annualIncome;

  let score: number;
  if (ratio < 0.05) score = 20;
  else if (ratio < 0.15) score = 16;
  else if (ratio < 0.3) score = 12;
  else if (ratio < 0.5) score = 8;
  else score = Math.max(0, Math.round(8 - (ratio - 0.5) * 16));

  if (lending > personalDebt) score = Math.min(20, score + 2);
  return score;
}

function scoreConsistency(transactions: Transaction[], monthsBack: number): number {
  const expenses = transactions.filter((t) => t.transaction_type === "expense");
  const byMonth: Record<string, number> = {};
  expenses.forEach((t) => {
    const key = `${t.year}-${t.month}`;
    byMonth[key] = (byMonth[key] || 0) + t.amount;
  });

  const values = Object.values(byMonth);
  if (values.length < 2) return 12;

  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 20;

  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean;

  if (cv < 0.15) return 20;
  if (cv < 0.25) return 16;
  if (cv < 0.4) return 12;
  if (cv < 0.6) return 8;
  return 4;
}

function descSavings(score: number): string {
  if (score >= 16) return "Tỷ lệ tiết kiệm tốt, bạn đang quản lý thu chi hiệu quả.";
  if (score >= 8) return "Bạn có tiết kiệm nhưng còn ít, cố gắng tăng thêm.";
  return "Chi tiêu vượt thu nhập, cần cắt giảm ngay.";
}
function descDiversity(score: number): string {
  if (score >= 15) return "Chi tiêu phân bổ hợp lý giữa các danh mục.";
  if (score >= 10) return "Chi tiêu hơi tập trung vào một vài danh mục.";
  return "Chi tiêu quá tập trung, nên đa dạng hoá.";
}
function descEssentials(score: number): string {
  if (score >= 15) return "Tỷ lệ chi thiết yếu và tùy ý cân bằng.";
  return "Nên điều chỉnh tỷ lệ chi thiết yếu / tùy ý.";
}
function descDebt(score: number): string {
  if (score >= 16) return "Gánh nặng nợ thấp, tài chính lành mạnh.";
  if (score >= 8) return "Nợ ở mức chấp nhận được, theo dõi sát hơn.";
  return "Gánh nặng nợ cao, cần có kế hoạch trả nợ rõ ràng.";
}
function descConsistency(score: number): string {
  if (score >= 16) return "Chi tiêu hàng tháng rất ổn định.";
  if (score >= 8) return "Chi tiêu dao động vừa phải giữa các tháng.";
  return "Chi tiêu biến động mạnh, nên lập ngân sách cố định.";
}
