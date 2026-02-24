-- OAuth トークンのサーバーサイド暗号化保存テーブル
-- クライアントは tokenRef（UUID）のみ保持し、生トークンはサーバーに保存

CREATE TABLE oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_ref text UNIQUE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'microsoft')),
  email text NOT NULL,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  expires_at bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS を有効化（ポリシーなし = anon key でアクセス不可、service_role でバイパス）
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- インデックス
CREATE INDEX idx_oauth_tokens_token_ref ON oauth_tokens (token_ref);
CREATE INDEX idx_oauth_tokens_email_provider ON oauth_tokens (email, provider);
