"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const pageTitles: Record<string, string> = {
  "/": "Trang chủ",
  "/giao-dich": "Giao dịch",
  "/danh-muc": "Danh mục",
  "/khoan-vay": "Khoản vay",
  "/bao-cao": "Báo cáo",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== "/" && pathname.startsWith(path)) return title;
  }
  return "Quản lý Tài chính";
}

export function Header() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
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

      <h2 className="text-lg font-semibold">{title}</h2>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button size="sm">
          <Plus className="size-4" />
          Thêm nhanh
        </Button>
      </div>
    </header>
  );
}
