import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql`SELECT cash, bank FROM balance_config WHERE id = 1`;
    if (result.length === 0) {
      return NextResponse.json({ cash: 0, bank: 0 });
    }
    const { cash, bank } = result[0] as { cash: number; bank: number };
    return NextResponse.json({ cash: Number(cash), bank: Number(bank) });
  } catch (error) {
    console.error("Error reading balance config:", error);
    return NextResponse.json({ error: "Failed to read balance config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const cash = Number(body.cash ?? 0);
    const bank = Number(body.bank ?? 0);

    await sql`
      INSERT INTO balance_config (id, cash, bank)
      VALUES (1, ${cash}, ${bank})
      ON CONFLICT (id) DO UPDATE SET cash = EXCLUDED.cash, bank = EXCLUDED.bank
    `;

    return NextResponse.json({ cash, bank });
  } catch (error) {
    console.error("Error writing balance config:", error);
    return NextResponse.json({ error: "Failed to write balance config" }, { status: 500 });
  }
}
