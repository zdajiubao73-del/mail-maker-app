// tokenRef → アクセストークン解決 + サーバーサイドリフレッシュ

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encrypt, decrypt } from "./crypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// 5分のバッファ（期限切れ前にリフレッシュ）
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

type ResolvedToken = {
  accessToken: string;
  provider: "google" | "microsoft";
  email: string;
};

type TokenRecord = {
  id: string;
  token_ref: string;
  provider: "google" | "microsoft";
  email: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  expires_at: number;
};

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * tokenRef からアクセストークンを解決する。
 * 期限切れの場合はリフレッシュトークンで更新し、DB を更新して新トークンを返す。
 */
export async function resolveToken(tokenRef: string): Promise<ResolvedToken> {
  const client = getServiceClient();

  const { data, error } = await client
    .from("oauth_tokens")
    .select("*")
    .eq("token_ref", tokenRef)
    .single();

  if (error || !data) {
    throw { status: 401, message: "トークンが見つかりません。再認証してください。" };
  }

  const record = data as TokenRecord;
  const now = Date.now();

  // 期限内ならそのまま返す
  if (record.expires_at > now + EXPIRY_BUFFER_MS) {
    const accessToken = await decrypt(record.access_token_encrypted);
    return {
      accessToken,
      provider: record.provider,
      email: record.email,
    };
  }

  // 期限切れ → リフレッシュ
  if (!record.refresh_token_encrypted) {
    throw {
      status: 401,
      message: "トークンが期限切れで、リフレッシュトークンがありません。再認証してください。",
    };
  }

  const refreshToken = await decrypt(record.refresh_token_encrypted);
  const refreshed = await refreshOAuthToken(record.provider, refreshToken);

  // DB を更新
  const newAccessEncrypted = await encrypt(refreshed.accessToken);
  const newExpiresAt = Date.now() + (refreshed.expiresIn ?? 3600) * 1000;

  const updateData: Record<string, unknown> = {
    access_token_encrypted: newAccessEncrypted,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  };

  // リフレッシュで新しい refresh_token が返る場合（Microsoft の場合）
  if (refreshed.refreshToken) {
    updateData.refresh_token_encrypted = await encrypt(refreshed.refreshToken);
  }

  await client
    .from("oauth_tokens")
    .update(updateData)
    .eq("id", record.id);

  return {
    accessToken: refreshed.accessToken,
    provider: record.provider,
    email: record.email,
  };
}

/**
 * tokenRef をDBから削除する
 */
export async function deleteToken(tokenRef: string): Promise<void> {
  const client = getServiceClient();
  await client.from("oauth_tokens").delete().eq("token_ref", tokenRef);
}

/**
 * プロバイダ別の OAuth トークンリフレッシュ
 */
async function refreshOAuthToken(
  provider: "google" | "microsoft",
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  if (provider === "google") {
    return refreshGoogleToken(refreshToken);
  }
  return refreshMicrosoftToken(refreshToken);
}

async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ accessToken: string; expiresIn?: number }> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  if (!clientId) {
    throw { status: 500, message: "GOOGLE_CLIENT_ID が設定されていません。" };
  }

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    console.error(`Google token refresh failed: status=${response.status}`);
    throw { status: 401, message: "Googleトークンの更新に失敗しました。再認証してください。" };
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

async function refreshMicrosoftToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  if (!clientId) {
    throw { status: 500, message: "MICROSOFT_CLIENT_ID が設定されていません。" };
  }

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: "refresh_token",
    scope: "Mail.Send User.Read offline_access",
  });

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );

  if (!response.ok) {
    console.error(`Microsoft token refresh failed: status=${response.status}`);
    throw { status: 401, message: "Microsoftトークンの更新に失敗しました。再認証してください。" };
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token, // Microsoft は新しい refresh_token を返す
    expiresIn: data.expires_in,
  };
}
