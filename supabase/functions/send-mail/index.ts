// Gmail API 経由でメールを送信する Edge Function
// アクセストークンはクライアントから渡される

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: AttachmentData[];
}

/**
 * RFC 2822 準拠のメール本文を Base64URL エンコードする
 * 添付ファイルがある場合は multipart/mixed で MIME 構築
 */
function createRawEmail(params: {
  to: string;
  from: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: AttachmentData[];
}): string {
  const lines: string[] = [];
  const hasAttachments = params.attachments && params.attachments.length > 0;

  lines.push(`To: ${params.to}`);
  lines.push(`From: ${params.from}`);
  if (params.cc && params.cc.length > 0) {
    lines.push(`Cc: ${params.cc.join(', ')}`);
  }
  if (params.bcc && params.bcc.length > 0) {
    lines.push(`Bcc: ${params.bcc.join(', ')}`);
  }
  lines.push(`Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`);
  lines.push('MIME-Version: 1.0');

  if (!hasAttachments) {
    // テキストのみ（従来の形式）
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(btoa(unescape(encodeURIComponent(params.body))));
  } else {
    // multipart/mixed（添付あり）
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push('');

    // 本文パート
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(btoa(unescape(encodeURIComponent(params.body))));

    // 添付ファイルパート
    for (const att of params.attachments!) {
      lines.push('');
      lines.push(`--${boundary}`);
      const encodedName = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(att.name)))}?=`;
      lines.push(`Content-Type: ${att.mimeType}; name="${encodedName}"`);
      lines.push(`Content-Disposition: attachment; filename="${encodedName}"`);
      lines.push('Content-Transfer-Encoding: base64');
      lines.push('');
      lines.push(att.base64);
    }

    // 終端
    lines.push('');
    lines.push(`--${boundary}--`);
  }

  const rawMessage = lines.join('\r\n');

  // Base64URL エンコード
  return btoa(rawMessage)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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

  try {
    const body: SendMailRequest = await req.json();

    // バリデーション
    if (!body.accessToken) {
      return new Response(
        JSON.stringify({ error: 'アクセストークンが必要です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!body.to || !body.subject || !body.body) {
      return new Response(
        JSON.stringify({ error: '宛先、件名、本文は必須です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // メールアドレス形式検証
    if (!isValidEmail(body.to)) {
      return new Response(
        JSON.stringify({ error: `無効な宛先メールアドレスです: ${body.to}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // CC/BCCメールアドレス形式検証
    if (body.cc) {
      for (const addr of body.cc) {
        if (!isValidEmail(addr)) {
          return new Response(
            JSON.stringify({ error: `無効なCCメールアドレスです: ${addr}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
      }
    }
    if (body.bcc) {
      for (const addr of body.bcc) {
        if (!isValidEmail(addr)) {
          return new Response(
            JSON.stringify({ error: `無効なBCCメールアドレスです: ${addr}` }),
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

    // 送信者のメールアドレスを取得（常にGoogleトークンのメールを使用）
    const userInfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${body.accessToken}` } },
    );

    if (!userInfoRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Googleアカウントの認証が無効です。再認証してください。' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userInfo = await userInfoRes.json();
    const fromEmail = userInfo.email; // fromフィールドのオーバーライドを削除

    // MIME形式のメールを構築
    const rawMessage = createRawEmail({
      to: body.to,
      from: fromEmail,
      subject: body.subject,
      body: body.body,
      cc: body.cc,
      bcc: body.bcc,
      attachments: body.attachments,
    });

    // Gmail API で送信
    const gmailRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${body.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawMessage }),
      },
    );

    if (!gmailRes.ok) {
      const statusCode = gmailRes.status;

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

      console.error(`Gmail API error: status=${statusCode}`);
      return new Response(
        JSON.stringify({ error: 'メールの送信に失敗しました。' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const result = await gmailRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        threadId: result.threadId,
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
