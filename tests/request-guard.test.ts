import { describe, expect, it } from "vitest";

import {
  assertRateLimit,
  assertSameOrigin,
} from "../src/lib/server/request-guard";

function makeRequest(url: string, headers: Record<string, string>) {
  return new Request(url, {
    method: "POST",
    headers,
  });
}

describe("request guard", () => {
  it("accepts same-origin POST requests", () => {
    const request = makeRequest("https://example.com/api/session/start", {
      origin: "https://example.com",
      host: "example.com",
      "x-forwarded-proto": "https",
    });

    expect(assertSameOrigin(request)).toEqual({ ok: true });
  });

  it("rejects mismatched origins", () => {
    const request = makeRequest("https://example.com/api/session/start", {
      origin: "https://evil.example",
      host: "example.com",
      "x-forwarded-proto": "https",
    });

    expect(assertSameOrigin(request)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("enforces rate limits per scope and client", () => {
    const request = makeRequest("https://example.com/api/session/start", {
      host: "example.com",
      "x-forwarded-proto": "https",
      "x-forwarded-for": "1.1.1.1",
    });

    expect(assertRateLimit(request, "test-scope", 2)).toEqual({ ok: true });
    expect(assertRateLimit(request, "test-scope", 2)).toEqual({ ok: true });
    expect(assertRateLimit(request, "test-scope", 2)).toMatchObject({
      ok: false,
      status: 429,
    });
  });
});
