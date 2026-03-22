import { NextResponse } from "next/server";

import {
  assertRateLimit,
  assertSameOrigin,
} from "@/lib/server/request-guard";
import { appendAttemptEvents, appendSetResult } from "@/lib/sheets/service";
import { progressFlushSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { ok: false, error: originCheck.error },
      { status: originCheck.status },
    );
  }

  const rateCheck = assertRateLimit(request, "progress-flush", 120);
  if (!rateCheck.ok) {
    return NextResponse.json(
      { ok: false, error: rateCheck.error },
      { status: rateCheck.status },
    );
  }

  const body = await request.json();
  const parsed = progressFlushSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request body",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (parsed.data.events && parsed.data.events.length > 0) {
    await appendAttemptEvents(parsed.data.events);
  }

  if (parsed.data.setResult) {
    await appendSetResult(parsed.data.setResult);
  }

  return NextResponse.json({
    ok: true,
  });
}
