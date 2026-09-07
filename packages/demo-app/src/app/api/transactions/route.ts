import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { sanitizeCreateTransactionBody } from "@/lib/transactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("id,user_id,wallet_address,tx_hash,status,agent_address,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[transactions GET]", error.message);
      return NextResponse.json({ error: "Unable to load transactions." }, { status: 500 });
    }

    return NextResponse.json({ transactions: data ?? [] });
  } catch (err) {
    console.error("[transactions GET]", err);
    return NextResponse.json({ error: "Unable to load transactions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const sanitized = sanitizeCreateTransactionBody(raw);
    if (!sanitized.ok) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 });
    }

    const { tx_hash, status, wallet_address, agent_address } = sanitized.data;

    // Ownership is always taken from the session — never from the client body.
    const { data, error } = await supabase
      .from("transactions")
      .upsert(
        {
          user_id: user.id,
          tx_hash,
          status: status ?? "confirmed",
          wallet_address,
          agent_address,
        },
        { onConflict: "user_id,tx_hash", ignoreDuplicates: false },
      )
      .select("id,user_id,wallet_address,tx_hash,status,agent_address,created_at")
      .single();

    if (error) {
      console.error("[transactions POST]", error.message);
      return NextResponse.json({ error: "Unable to save transaction." }, { status: 500 });
    }

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (err) {
    console.error("[transactions POST]", err);
    return NextResponse.json({ error: "Unable to save transaction." }, { status: 500 });
  }
}
