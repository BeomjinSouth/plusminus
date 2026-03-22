type GuardResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_BUCKETS = 2000;

function normalizeOrigin(origin: string) {
  try {
    const parsed = new URL(origin);
    return parsed.origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(request: Request) {
  const allowed = new Set<string>();
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";

  if (host) {
    allowed.add(`${proto}://${host}`);
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const normalized = normalizeOrigin(appUrl);
    if (normalized) {
      allowed.add(normalized);
    }
  }

  return allowed;
}

export function assertSameOrigin(request: Request): GuardResult {
  const origin = request.headers.get("origin");

  if (!origin) {
    return { ok: true };
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return {
      ok: false,
      status: 400,
      error: "Invalid origin header",
    };
  }

  const allowedOrigins = getAllowedOrigins(request);

  if (!allowedOrigins.has(normalizedOrigin)) {
    return {
      ok: false,
      status: 403,
      error: "Origin not allowed",
    };
  }

  return { ok: true };
}

function pruneBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");

  return forwardedIp || realIp || "unknown";
}

export function assertRateLimit(
  request: Request,
  scope: string,
  limit: number,
): GuardResult {
  const now = Date.now();
  pruneBuckets(now);

  const key = `${scope}:${getClientKey(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return { ok: true };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      status: 429,
      error: "Too many requests",
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true };
}
