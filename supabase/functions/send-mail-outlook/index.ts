// Microsoft Graph API 経由でメールを送信する Edge Function
// アクセストークンはクライアントから渡される

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getClientIp, checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { resolveToken } from "../_shared/token-resolver.ts";

const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const MAX_CC_RECIPIENTS = 10;
const MAX_BCC_RECIPIENTS = 10;
const MAX_TOTAL_RECIPIENTS = 20;
const MAX_ATTACHMENTS = 10;

const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  // ネイティブアプリ（Origin無し）を許可
  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    };
  }
  // localhost（開発用）を許可
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };
}

// --- APIキー認証 ---

function authenticateRequest(req: Request): boolean {
  if (!SUPABASE_ANON_KEY) return true; // キー未設定時はスキップ（開発環境）

  const apikey = req.headers.get('apikey');
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  return apikey === SUPABASE_ANON_KEY || bearerToken === SUPABASE_ANON_KEY;
}

// --- メールアドレスバリデーション ---

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  const localPart = email.split('@')[0];
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return false;
  }
  return true;
}

interface AttachmentData {
  name: string;
  mimeType: string;
  base64: string;
}

interface SendMailRequest {
  accessToken?: string;
  tokenRef?: string;
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: AttachmentData[];
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // APIキー認証
  if (!authenticateRequest(req)) {
    return new Response(
      JSON.stringify({ error: '認証が必要です。' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // レート制限（10 req/min per IP）
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`send-mail-outlook:${clientIp}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterMs, corsHeaders);
  }

  try {
    const body: SendMailRequest = await req.json();

    // tokenRef → アクセストークン解決（後方互換: accessToken も引き続きサポート）
    let accessToken: string;
    if (body.tokenRef) {
      try {
        const resolved = await resolveToken(body.tokenRef);
        accessToken = resolved.accessToken;
      } catch (err) {
        const tokenErr = err as { status?: number; message?: string };
        return new Response(
          JSON.stringify({ error: tokenErr.message ?? 'トークンの解決に失敗しました。' }),
          { status: tokenErr.status ?? 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    } else if (body.accessToken) {
      accessToken = body.accessToken;
    } else {
      return new Response(
        JSON.stringify({ error: 'tokenRef または accessToken が必要です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // バリデーション
    if (!body.to || !body.subject || !body.body) {
      return new Response(
        JSON.stringify({ error: '宛先、件名、本文は必須です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // メールアドレス形式検証
    if (!isValidEmail(body.to)) {
      return new Response(
        JSON.stringify({ error: '無効な宛先メールアドレスです。' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // CC/BCCメールアドレス形式検証
    if (body.cc) {
      for (const addr of body.cc) {
        if (!isValidEmail(addr)) {
          return new Response(
            JSON.stringify({ error: '無効なCCメールアドレスです。' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
      }
    }
    if (body.bcc) {
      for (const addr of body.bcc) {
        if (!isValidEmail(addr)) {
          return new Response(
            JSON.stringify({ error: '無効なBCCメールアドレスです。' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
      }
    }

    // CC/BCC件数制限
    const ccCount = body.cc?.length ?? 0;
    const bccCount = body.bcc?.length ?? 0;
    const totalCount = 1 + ccCount + bccCount;

    if (ccCount > MAX_CC_RECIPIENTS) {
      return new Response(
        JSON.stringify({ error: `CCは${MAX_CC_RECIPIENTS}件以内にしてください。` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (bccCount > MAX_BCC_RECIPIENTS) {
      return new Response(
        JSON.stringify({ error: `BCCは${MAX_BCC_RECIPIENTS}件以内にしてください。` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (totalCount > MAX_TOTAL_RECIPIENTS) {
      return new Response(
        JSON.stringify({ error: `送信先の合計は${MAX_TOTAL_RECIPIENTS}件以内にしてください。` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 入力長制限
    if (body.subject.length > 200) {
      return new Response(
        JSON.stringify({ error: '件名は200文字以内にしてください。' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (body.body.length > 10000) {
      return new Response(
        JSON.stringify({ error: '本文は10000文字以内にしてください。' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 添付ファイル件数制限
    if (body.attachments && body.attachments.length > MAX_ATTACHMENTS) {
      return new Response(
        JSON.stringify({ error: `添付ファイルは${MAX_ATTACHMENTS}件以内にしてください。` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Microsoftアカウントの認証検証
    const userInfoRes = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!userInfoRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Microsoftアカウントの認証が無効です。再認証してください。' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Microsoft Graph API のメール送信リクエストを構築
    const toRecipients = [
      { emailAddress: { address: body.to } },
    ];

    const ccRecipients = body.cc?.map((addr) => ({
      emailAddress: { address: addr },
    }));

    const bccRecipients = body.bcc?.map((addr) => ({
      emailAddress: { address: addr },
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message: Record<string, any> = {
      subject: body.subject,
      body: {
        contentType: 'Text',
        content: body.body,
      },
      toRecipients,
    };

    if (ccRecipients && ccRecipients.length > 0) {
      message.ccRecipients = ccRecipients;
    }
    if (bccRecipients && bccRecipients.length > 0) {
      message.bccRecipients = bccRecipients;
    }

    // 添付ファイル
    if (body.attachments && body.attachments.length > 0) {
      message.attachments = body.attachments.map((att) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.name,
        contentType: att.mimeType,
        contentBytes: att.base64,
      }));
    }

    // Microsoft Graph API で送信
    const graphRes = await fetch(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!graphRes.ok) {
      const statusCode = graphRes.status;

      if (statusCode === 401) {
        return new Response(
          JSON.stringify({ error: '認証が切れています。再認証してください。' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ error: '送信回数の上限に達しました。しばらく待ってから再試行してください。' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      console.error(`Microsoft Graph API error: status=${statusCode}`);
      return new Response(
        JSON.stringify({ error: 'メールの送信に失敗しました。' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Graph API の sendMail は 202 Accepted でボディなし
    return new Response(
      JSON.stringify({
        success: true,
        messageId: `outlook-${Date.now()}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Send mail error:', error instanceof Error ? error.message : 'unknown');
    return new Response(
      JSON.stringify({ error: 'メール送信中にエラーが発生しました。' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
