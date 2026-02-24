import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * メールアドレスや電話番号などの PII をマスクする正規表現
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

/**
 * 文字列中のメールアドレス・電話番号をマスクする
 */
function stripPii(value: string): string {
  return value
    .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
    .replace(PHONE_REGEX, '[PHONE_REDACTED]');
}

/**
 * Sentry イベントから PII を除去する beforeSend フック
 */
function beforeSend(
  event: Sentry.ErrorEvent,
): Sentry.ErrorEvent | null {
  // メッセージのマスク
  if (event.message) {
    event.message = stripPii(event.message);
  }

  // 例外メッセージのマスク
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) {
        ex.value = stripPii(ex.value);
      }
    }
  }

  // breadcrumbs のマスク
  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      if (bc.message) {
        bc.message = stripPii(bc.message);
      }
      if (bc.data) {
        for (const key of Object.keys(bc.data)) {
          const val = bc.data[key];
          if (typeof val === 'string') {
            bc.data[key] = stripPii(val);
          }
        }
      }
    }
  }

  return event;
}

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.log('[Sentry] DSN not set, skipping initialization');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    // PII フィルタリング
    beforeSend,
    // デフォルトの PII 送信を無効化
    sendDefaultPii: false,
  });
}

export { Sentry };
