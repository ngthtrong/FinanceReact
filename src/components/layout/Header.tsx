"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Plus, LayoutDashboard, ArrowLeftRight, Landmark, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Trang chủ",
  "/giao-dich": "Giao dịch",
  "/danh-muc": "Danh mục",
  "/khoan-vay": "Khoản vay",
  "/bao-cao": "Báo cáo",
  "/thiet-lap": "Thiết lập",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== "/" && pathname.startsWith(path)) return title;
  }
  return "Quản lý Tài chính";
}

const bottomNavItems = [
  { href: "/", icon: LayoutDashboard, label: "Trang chủ" },
  { href: "/giao-dich", icon: ArrowLeftRight, label: "Giao dịch" },
  { href: "/khoan-vay", icon: Landmark, label: "Khoản vay" },
  { href: "/bao-cao", icon: BarChart3, label: "Báo cáo" },
  { href: "/thiet-lap", icon: Settings, label: "Thiết lập" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = getPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b bg-background px-3 md:h-14 md:px-6">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-4" />
            <span className="sr-only">Mở menu</span>
          </Button>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-14 items-center px-6 border-b">
              <SheetTitle className="text-lg font-bold tracking-tight">
                Quản lý Tài chính
              </SheetTitle>
            </div>
            <div className="py-4">
              <SidebarNav onNavigate={() => setSidebarOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <h2 className="text-base font-semibold md:text-lg">{title}</h2>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Button size="sm" className="h-8 text-xs px-2.5 md:px-3 md:text-sm md:h-9" onClick={() => router.push("/giao-dich")}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Thêm nhanh</span>
          </Button>
        </div>
      </header>

      {/* Mobile bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t bg-background md:hidden">
        {bottomNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("size-5", isActive && "text-primary")} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
