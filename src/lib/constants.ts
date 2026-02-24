export const SPENDING_THRESHOLDS = {
  weekly: {
    "Ăn chính": 250_000,
    "Ăn vặt": 100_000,
    "Cà phê": 100_000,
    "Di chuyển": 150_000,
    "Nhà ở": 200_000,
    "Tiện ích": 100_000,
    "Quan hệ xã hội": 150_000,
    "Gấu": 200_000,
    "Gia đình": 200_000,
    "Internet/Game": 50_000,
    "Giải trí": 100_000,
    "Tinh thần": 100_000,
    "Cầu lông": 100_000,
    "Bi-da": 50_000,
    "Bơi": 50_000,
    "Gym": 100_000,
    "Thể thao": 100_000,
    "Cơ thể": 100_000,
    "Học tập": 100_000,
    "English": 100_000,
    "Quần áo": 100_000,
    "Thuốc lá": 100_000,
    "Cho vay": 500_000,
    "Khác": 200_000,
    "Sự cố": 200_000,
    "Ngu": 50_000,
  } as Record<string, number>,
  monthly: {
    "Ăn chính": 1_200_000,
    "Ăn vặt": 400_000,
    "Cà phê": 400_000,
    "Di chuyển": 500_000,
    "Nhà ở": 800_000,
    "Tiện ích": 300_000,
    "Quan hệ xã hội": 500_000,
    "Gấu": 800_000,
    "Gia đình": 500_000,
    "Internet/Game": 200_000,
    "Giải trí": 300_000,
    "Tinh thần": 300_000,
    "Cầu lông": 300_000,
    "Bi-da": 200_000,
    "Bơi": 200_000,
    "Gym": 300_000,
    "Thể thao": 300_000,
    "Cơ thể": 300_000,
    "Học tập": 300_000,
    "English": 300_000,
    "Quần áo": 300_000,
    "Thuốc lá": 300_000,
    "Cho vay": 2_000_000,
    "Khác": 500_000,
    "Sự cố": 500_000,
    "Ngu": 100_000,
  } as Record<string, number>,
  monthlyTotal: 5_000_000,
  weeklyTotal: 1_500_000,
};

export const ESSENTIAL_GROUPS = ["Ăn uống", "Sinh hoạt", "Học tập"];
export const DISCRETIONARY_GROUPS = ["Giải trí", "Thể thao", "Xã hội", "Cá nhân"];

export const HEALTH_LABELS: Record<string, { label: string; color: string }> = {
  excellent: { label: "Xuất sắc", color: "text-green-600" },
  good: { label: "Tốt", color: "text-green-500" },
  average: { label: "Trung bình", color: "text-yellow-500" },
  needsImprovement: { label: "Cần cải thiện", color: "text-orange-500" },
  critical: { label: "Nguy hiểm", color: "text-red-500" },
};

export function getHealthLabel(score: number) {
  if (score >= 90) return HEALTH_LABELS.excellent;
  if (score >= 70) return HEALTH_LABELS.good;
  if (score >= 50) return HEALTH_LABELS.average;
  if (score >= 30) return HEALTH_LABELS.needsImprovement;
  return HEALTH_LABELS.critical;
}

export const CHART_COLORS = [
  "#3b82f6", "#22c55e", "#ef4444", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ec4899", "#10b981",
  "#f97316", "#6366f1",
];

export const GROUP_COLORS: Record<
  string,
  { bg: string; text: string; border: string; hex: string; dot: string }
> = {
  "Ăn uống": {
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-300 dark:border-orange-800",
    hex: "#f97316",
    dot: "bg-orange-500",
  },
  "Sinh hoạt": {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-800",
    hex: "#3b82f6",
    dot: "bg-blue-500",
  },
  "Xã hội": {
    bg: "bg-purple-100 dark:bg-purple-950",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-300 dark:border-purple-800",
    hex: "#8b5cf6",
    dot: "bg-purple-500",
  },
  "Giải trí": {
    bg: "bg-pink-100 dark:bg-pink-950",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-300 dark:border-pink-800",
    hex: "#ec4899",
    dot: "bg-pink-500",
  },
  "Thể thao": {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-300 dark:border-green-800",
    hex: "#22c55e",
    dot: "bg-green-500",
  },
  "Học tập": {
    bg: "bg-cyan-100 dark:bg-cyan-950",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-300 dark:border-cyan-800",
    hex: "#06b6d4",
    dot: "bg-cyan-500",
  },
  "Cá nhân": {
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-800",
    hex: "#f59e0b",
    dot: "bg-amber-500",
  },
  "Tài chính": {
    bg: "bg-slate-100 dark:bg-slate-900",
    text: "text-slate-700 dark:text-slate-400",
    border: "border-slate-300 dark:border-slate-700",
    hex: "#64748b",
    dot: "bg-slate-500",
  },
  "Thu nhập": {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-800",
    hex: "#10b981",
    dot: "bg-emerald-500",
  },
};

const DEFAULT_GROUP_COLOR = {
  bg: "bg-gray-100 dark:bg-gray-900",
  text: "text-gray-700 dark:text-gray-400",
  border: "border-gray-300 dark:border-gray-700",
  hex: "#6b7280",
  dot: "bg-gray-500",
};

export function getGroupColor(group: string) {
  return GROUP_COLORS[group] ?? DEFAULT_GROUP_COLOR;
}
