import { NextResponse } from "next/server";

import {
  assertRateLimit,
  assertSameOrigin,
} from "@/lib/server/request-guard";
import { appendAttemptEvents } from "@/lib/sheets/service";
import { attemptsLogSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { ok: false, error: originCheck.error },
      { status: originCheck.status },
    );
  }

  const rateCheck = assertRateLimit(request, "attempts-log", 300);
  if (!rateCheck.ok) {
    return NextResponse.json(
      { ok: false, error: rateCheck.error },
      { status: rateCheck.status },
    );
  }

  const body = await request.json();
  const parsed = attemptsLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request body",
      },
      { status: 400 },
    );
  }

  const result = await appendAttemptEvents(parsed.data.events);

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    appendedRows: result.appendedRows,
  });
}
