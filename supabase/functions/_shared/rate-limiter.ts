// IP ベースのインメモリレート制限
// Deno Deploy のアイソレート内で Map を保持

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

// アイソレート単位のインメモリストア
const store = new Map<string, RateLimitEntry>();

// 古いエントリを定期的にクリーンアップ（メモリリーク防止）
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * リクエストからクライアントIPを取得する
 */
export function getClientIp(req: Request): string {
  // Supabase Edge Functions / Deno Deploy は X-Forwarded-For を付与
  const forwarded = req.headers.get("X-Forwarded-For");
  if (forwarded) {
    // 最初のIPがオリジナルクライアント
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("X-Real-IP");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * レート制限をチェックする
 * @param key - 制限キー（例: "generate-mail:192.168.1.1"）
 * @param config - 制限設定
 * @returns 許可/拒否とリトライまでの時間
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // 初回 or ウィンドウ期限切れ
  if (!entry || entry.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true, retryAfterMs: 0 };
  }

  // ウィンドウ内
  if (entry.count < config.maxRequests) {
    entry.count++;
    return { allowed: true, retryAfterMs: 0 };
  }

  // 制限超過
  return {
    allowed: false,
    retryAfterMs: entry.resetAt - now,
  };
}

/**
 * 429 Too Many Requests レスポンスを生成する
 */
export function rateLimitResponse(
  retryAfterMs: number,
  corsHeaders: Record<string, string>,
): Response {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: "リクエストが多すぎます。しばらく待ってから再度お試しください。",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
