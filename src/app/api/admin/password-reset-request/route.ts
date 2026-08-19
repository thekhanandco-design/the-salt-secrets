import { NextResponse } from "next/server";

// Kept as a fail-closed compatibility endpoint. Public reset requests moved to /api/auth/password-reset-request.
export async function POST() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
}
