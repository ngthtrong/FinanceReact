"use client";

import useSWR from "swr";
import { Payment } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PaymentsResponse {
  payments: Payment[];
  totalPaid: number;
}

export function usePayments(loanId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<PaymentsResponse>(
    loanId ? `/api/loans/${loanId}/payments` : null,
    fetcher
  );

  const deletePayment = async (paymentId: number) => {
    if (!loanId) return;
    const res = await fetch(
      `/api/loans/${loanId}/payments?paymentId=${paymentId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Không thể xóa thanh toán");
    }
    await mutate();
    return res.json();
  };

  return { data, error, isLoading, mutate, deletePayment };
}
