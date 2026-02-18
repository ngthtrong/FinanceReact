"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { SavingsGoal } from "@/types";
import { toast } from "sonner";

interface SavingsGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingsGoal;
  onSave: (goal: SavingsGoal) => Promise<void>;
}

export function SavingsGoalForm({
  open,
  onOpenChange,
  goal,
  onSave,
}: SavingsGoalFormProps) {
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [yearlyTarget, setYearlyTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMonthlyTarget(goal.monthlyTarget > 0 ? String(goal.monthlyTarget) : "");
      setYearlyTarget(goal.yearlyTarget > 0 ? String(goal.yearlyTarget) : "");
      setNotes(goal.notes || "");
    }
  }, [open, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        monthlyTarget: Number(monthlyTarget) || 0,
        yearlyTarget: Number(yearlyTarget) || 0,
        notes: notes.trim(),
      });
      toast.success("Đã cập nhật mục tiêu tiết kiệm");
      onOpenChange(false);
    } catch {
      toast.error("Không thể lưu mục tiêu tiết kiệm");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thiết lập mục tiêu tiết kiệm</DialogTitle>
          <DialogDescription>
            Đặt mục tiêu tiết kiệm hàng tháng và hàng năm để theo dõi tiến
            độ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-target">Mục tiêu hàng tháng (VND)</Label>
            <Input
              id="monthly-target"
              type="number"
              min={0}
              step={100000}
              placeholder="Ví dụ: 2000000"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearly-target">Mục tiêu hàng năm (VND)</Label>
            <Input
              id="yearly-target"
              type="number"
              min={0}
              step={1000000}
              placeholder="Ví dụ: 24000000"
              value={yearlyTarget}
              onChange={(e) => setYearlyTarget(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-notes">
              Ghi chú{" "}
              <span className="text-muted-foreground font-normal">
                (tùy chọn)
              </span>
            </Label>
            <Input
              id="savings-notes"
              placeholder="Ví dụ: Tiết kiệm để mua laptop"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Lưu mục tiêu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
