// AES-256-GCM 暗号化/復号ユーティリティ
// Web Crypto API (crypto.subtle) を使用

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96 bits（GCM推奨）
const KEY_LENGTH = 256; // bits

/**
 * 環境変数から暗号化キーを取得・インポートする
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyBase64 = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  if (!keyBase64) {
    throw new Error("TOKEN_ENCRYPTION_KEY が設定されていません。");
  }

  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  if (keyBytes.length !== KEY_LENGTH / 8) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY は${KEY_LENGTH / 8}バイトの Base64 文字列である必要があります。`,
    );
  }

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * 文字列を AES-256-GCM で暗号化する
 * @returns Base64 エンコードされた (IV + 暗号文)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  // IV + 暗号文を結合
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);

  // Base64 エンコード
  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * AES-256-GCM で暗号化されたデータを復号する
 * @param encryptedBase64 Base64 エンコードされた (IV + 暗号文)
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();

  // Base64 デコード
  const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0),
  );

  if (combined.length <= IV_LENGTH) {
    throw new Error("暗号化データが不正です。");
  }

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}
