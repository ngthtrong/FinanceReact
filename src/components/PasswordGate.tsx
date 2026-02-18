"use client";

import { useState, useEffect } from "react";

const PASSWORD = "ngthtrong";
const STORAGE_KEY = "site_auth";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 1500);
    }
  };

  if (!hydrated) return null;

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg">
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">
            Xác thực truy cập
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Nhập mật khẩu để tiếp tục
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mật khẩu"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary bg-background ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border"
              }`}
            />
            {error && (
              <p className="text-center text-xs text-red-500">
                Mật khẩu không đúng
              </p>
            )}
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-75"
            >
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
