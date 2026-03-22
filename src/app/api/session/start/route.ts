import { NextResponse } from "next/server";

import {
  assertRateLimit,
  assertSameOrigin,
} from "@/lib/server/request-guard";
import { logSessionStart } from "@/lib/sheets/service";
import { sessionStartSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { ok: false, error: originCheck.error },
      { status: originCheck.status },
    );
  }

  const rateCheck = assertRateLimit(request, "session-start", 30);
  if (!rateCheck.ok) {
    return NextResponse.json(
      { ok: false, error: rateCheck.error },
      { status: rateCheck.status },
    );
  }

  const body = await request.json();
  const parsed = sessionStartSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request body",
      },
      { status: 400 },
    );
  }

  const sessionId = crypto.randomUUID();
  const { school, grade, classNo, studentNo } = parsed.data;
  const studentKey = `${school}-${grade}-${classNo}-${studentNo}`;

  await logSessionStart({
    sessionId,
    school,
    grade,
    classNo,
    studentNo,
  });

  return NextResponse.json({
    sessionId,
    studentKey,
  });
}
