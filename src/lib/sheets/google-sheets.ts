import "server-only";

import { google } from "googleapis";

const SHEET_NAMES = {
  sessions: "sessions",
  attempts: "attempt_events",
  results: "set_results",
} as const;

type SheetName = (typeof SHEET_NAMES)[keyof typeof SHEET_NAMES];
type RowValue = string | number | boolean;
type AppendRowsOptions = {
  headers?: string[];
};

const readySheets = new Set<string>();

function getSheetsConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    spreadsheetId,
    clientEmail,
    privateKey,
  };
}

async function getSheetsClient() {
  const config = getSheetsConfig();
  if (!config) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return {
    spreadsheetId: config.spreadsheetId,
    client: google.sheets({
      version: "v4",
      auth,
    }),
  };
}

async function ensureSheetReady(
  sheets: NonNullable<Awaited<ReturnType<typeof getSheetsClient>>>,
  sheetName: SheetName,
  options?: AppendRowsOptions,
) {
  if (readySheets.has(sheetName)) {
    return;
  }

  const spreadsheet = await sheets.client.spreadsheets.get({
    spreadsheetId: sheets.spreadsheetId,
  });

  const existingSheet = spreadsheet.data.sheets?.find(
    (sheet) => sheet.properties?.title === sheetName,
  );

  if (!existingSheet) {
    try {
      await sheets.client.spreadsheets.batchUpdate({
        spreadsheetId: sheets.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });
    } catch {
      // Another request may have created the sheet first.
    }
  }

  if (options?.headers && options.headers.length > 0) {
    const headerRow = await sheets.client.spreadsheets.values.get({
      spreadsheetId: sheets.spreadsheetId,
      range: `${sheetName}!1:1`,
    });

    const hasHeaderValues =
      !!headerRow.data.values &&
      headerRow.data.values.length > 0 &&
      headerRow.data.values[0].some((cell) => `${cell}`.trim().length > 0);

    if (!hasHeaderValues) {
      await sheets.client.spreadsheets.values.update({
        spreadsheetId: sheets.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [options.headers],
        },
      });
    }
  }

  readySheets.add(sheetName);
}

export async function appendRows(
  sheetName: SheetName,
  rows: RowValue[][],
  options?: AppendRowsOptions,
) {
  const sheets = await getSheetsClient();

  if (!sheets) {
    return {
      mode: "noop" as const,
      appendedRows: rows.length,
    };
  }

  await ensureSheetReady(sheets, sheetName, options);

  await sheets.client.spreadsheets.values.append({
    spreadsheetId: sheets.spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });

  return {
    mode: "live" as const,
    appendedRows: rows.length,
  };
}

export { SHEET_NAMES };
