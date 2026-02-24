// OAuth トークン管理 Edge Function
// トークンの保存（store）と削除（delete）を提供する

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIp, checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { encrypt } from "../_shared/crypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19006",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  if (!origin) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    };
  }
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

function authenticateRequest(req: Request): boolean {
  if (!SUPABASE_ANON_KEY) return true;
  const apikey = req.headers.get("apikey");
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return apikey === SUPABASE_ANON_KEY || bearerToken === SUPABASE_ANON_KEY;
}

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POSTメソッドのみ対応しています。" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!authenticateRequest(req)) {
    return new Response(
      JSON.stringify({ error: "認証が必要です。" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // レート制限（30 req/min per IP）
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`manage-tokens:${clientIp}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterMs, corsHeaders);
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "store") {
      return await handleStore(body, corsHeaders);
    }

    if (action === "delete") {
      return await handleDelete(body, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'action は "store" または "delete" を指定してください。' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const err = error as { status?: number; message?: string };
    const status = err.status || 500;
    const message = err.message || "予期せぬエラーが発生しました。";
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/**
 * トークン保存: accessToken/refreshToken を暗号化して DB に保存し、tokenRef を返す
 */
async function handleStore(
  body: {
    provider?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    email?: string;
  },
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const { provider, accessToken, refreshToken, expiresAt, email } = body;

  // バリデーション
  if (!provider || !["google", "microsoft"].includes(provider)) {
    return new Response(
      JSON.stringify({ error: 'provider は "google" または "microsoft" を指定してください。' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!accessToken || typeof accessToken !== "string") {
    return new Response(
      JSON.stringify({ error: "accessToken は必須です。" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!email || typeof email !== "string") {
    return new Response(
      JSON.stringify({ error: "email は必須です。" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!expiresAt || typeof expiresAt !== "number") {
    return new Response(
      JSON.stringify({ error: "expiresAt は必須です。" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 暗号化
  const accessTokenEncrypted = await encrypt(accessToken);
  const refreshTokenEncrypted = refreshToken ? await encrypt(refreshToken) : null;

  // UUID で tokenRef を生成
  const tokenRef = crypto.randomUUID();

  const client = getServiceClient();

  // 既存トークンがあれば更新（email + provider でユニーク）
  const { data: existing } = await client
    .from("oauth_tokens")
    .select("id, token_ref")
    .eq("email", email)
    .eq("provider", provider)
    .single();

  if (existing) {
    // 既存レコードを更新
    await client
      .from("oauth_tokens")
      .update({
        token_ref: tokenRef,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // 新規挿入
    const { error } = await client.from("oauth_tokens").insert({
      token_ref: tokenRef,
      provider,
      email,
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("Failed to store token:", error.message);
      return new Response(
        JSON.stringify({ error: "トークンの保存に失敗しました。" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  return new Response(
    JSON.stringify({ tokenRef }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

/**
 * トークン削除: tokenRef で指定されたトークンを DB から削除する
 */
async function handleDelete(
  body: { tokenRef?: string },
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const { tokenRef } = body;

  if (!tokenRef || typeof tokenRef !== "string") {
    return new Response(
      JSON.stringify({ error: "tokenRef は必須です。" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const client = getServiceClient();
  await client.from("oauth_tokens").delete().eq("token_ref", tokenRef);

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
