"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  BarChart3,
  Tags,
  FileBarChart,
  Settings,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; icon: typeof LayoutDashboard; indent?: boolean }[] = [
  { href: "/", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/giao-dich", label: "Giao dịch", icon: ArrowLeftRight },
  { href: "/danh-muc", label: "Danh mục", icon: Tags },
  { href: "/khoan-vay", label: "Khoản vay", icon: Landmark },
  { href: "/du-kien", label: "Dự thu / Dự chi", icon: CalendarRange },
  { href: "/bao-cao", label: "Báo cáo", icon: BarChart3 },
  { href: "/bao-cao/chi-tiet", label: "So sánh 2023–2025", icon: FileBarChart, indent: true },
  { href: "/thiet-lap", label: "Thiết lập", icon: Settings },
];

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || (pathname.startsWith(item.href + "/") && !item.indent);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              item.indent && "ml-4 py-2 text-xs",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className={cn("size-5", item.indent && "size-4")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-background">
      <div className="flex h-14 items-center px-6 border-b">
        <h1 className="text-lg font-bold tracking-tight">
          Quản lý Tài chính
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav />
      </div>
    </aside>
  );
}
