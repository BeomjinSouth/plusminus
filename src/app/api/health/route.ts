import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: process.env.NEXT_PUBLIC_APP_NAME ?? "PlusMinus Lab",
    version: process.env.APP_VERSION ?? "dev",
    sheetsConfigured: Boolean(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
        process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    ),
    timestamp: new Date().toISOString(),
  });
}
