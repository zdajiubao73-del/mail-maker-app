# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AIメール自動作成・送信アプリ** — メールの文章作成をAIで自動化するiOSアプリ。ユーザーが送信相手の関係性・メールの目的・トーンを選択すると、AIが敬語・ビジネスマナーに配慮した日本語メールを自動生成し、OAuth連携で直接送信まで行える。

ターゲット: 学生（ゼミ・就活）、若手社会人（上司・取引先連絡）、ベテラン社会人（定型メール処理）

Built with Expo SDK 54, React 19, React Native 0.81, and TypeScript in strict mode.

## Product Requirements (要件定義書より)

### コア機能: AIメール自動生成

**メール作成の4ステップ:**
1. **送信相手の設定** — 関係性（上司/同僚/取引先/教授等）、社内/社外、役職レベル
2. **メールの目的設定** — ビジネス系（依頼/報告/相談/調整/お詫び/お礼/営業等）、就職・転職系、学校・学術系、プライベート系
3. **トーン・文体の設定** — 敬語レベル（最敬体〜カジュアル）、文章の長さ、雰囲気、緊急度
4. **追加情報の入力** — 要点、日時、固有名詞、補足事項

**3つの生成モード:**
- **かんたん作成** — 目的だけ選んですぐ生成（トーンはAI自動推定）
- **こだわり作成** — 全設定を細かく指定して生成
- **テンプレート** — シチュエーション別テンプレート一覧から選択

### 差別化機能

- **日本語特化** — 尊敬語/謙譲語/丁寧語の使い分け、時候の挨拶自動挿入、宛名フォーマット
- **履歴学習** — ユーザーの文体（言い回し・文の長さ・署名スタイル）を学習して反映
- **トーン調整** — 送信相手の関係性から敬語レベルを自動推定

### メール連携・送信

- **対応サービス:** Gmail（Phase 1）→ Outlook（Phase 2）→ Yahoo!/iCloud（Phase 3）
- **認証:** OAuth 2.0（パスワード非保持）
- **連絡先管理:** 複数アカウント対応、相手の関係性・役職を登録→トーン自動最適化
- **安全対策:** プレビュー必須、確認ダイアログ、送信後5秒取り消し、深夜送信警告、添付忘れ検知

### 画面構成

```
ホーム画面
├── かんたん作成
├── こだわり作成
├── テンプレート一覧
├── 履歴（過去に生成・送信したメール）
├── 連絡先（送信先の管理）
└── 設定
    ├── マイアカウント（メール連携管理）
    ├── プリセット管理（よく使う設定の保存）
    ├── 学習データ管理
    ├── プラン・課金
    └── プライバシー設定
```

### 収益化

フリーミアムモデル（無料: 1日5回生成・基本機能 / 有料: 無制限・全機能・広告なし・直接送信）。Apple In-App Purchase、RevenueCat検討。

### 技術構成

| レイヤー | 技術候補 |
|---------|---------|
| フロントエンド | Expo / React Native + TypeScript + expo-router + zustand or Redux |
| バックエンド | Firebase Cloud Functions / Supabase Edge Functions / Node.js + Express |
| データベース | Firestore / Supabase (PostgreSQL) |
| 認証 | Firebase Auth / Supabase Auth |
| AI API | OpenAI (GPT) / Anthropic (Claude) / Google Gemini |
| メール送信 | Gmail API / Microsoft Graph API |
| 課金 | RevenueCat |

### 非機能要件

- メール生成レスポンス: 5秒以内、アプリ起動: 3秒以内
- セキュリティ: OAuth 2.0、HTTPS通信、AES-256暗号化、APIキーはバックエンド管理
- プライバシー: GDPR/個人情報保護法準拠、ATT対応
- App Store審査: スパムフィルタリング、AI生成コンテンツの明示、ユーザー確認・編集機能

### 開発ロードマップ

- **Phase 1 (MVP):** メール生成（かんたん/こだわり）、Gmail連携、連絡先管理、課金、App Storeリリース
- **Phase 2 (品質向上):** 敬語使い分け強化、時候の挨拶、Outlook連携、送信取り消し・誤送信防止
- **Phase 3 (差別化):** 履歴学習、プリセット保存、Yahoo!/iCloud対応、添付忘れ・宛先間違い検知

## Commands

```bash
npm start           # Start Expo dev server
npm run ios         # Start iOS simulator
npm run android     # Start Android emulator
npm run web         # Start web version
npm run lint        # Run ESLint (expo lint)
npm run reset-project  # Move starter code to app-example/, create blank app/
```

No test framework is currently configured.

## Architecture

### Routing (Expo Router 6 — file-based)

Routes live in `app/`. The navigation hierarchy:

- `app/_layout.tsx` — Root Stack navigator with theme provider, RevenueCat initialization
- `app/(tabs)/_layout.tsx` — Bottom tab navigator (Home, 履歴, 連絡先, 設定)
- `app/(tabs)/index.tsx` — Home tab
- `app/(tabs)/history.tsx` — 履歴一覧
- `app/(tabs)/contacts.tsx` — 連絡先管理
- `app/(tabs)/settings.tsx` — 設定
- `app/create/simple.tsx` — かんたん作成
- `app/create/detailed.tsx` — こだわり作成
- `app/create/template.tsx` — テンプレートから作成
- `app/templates/index.tsx` — テンプレート一覧
- `app/preview.tsx` — メールプレビュー・編集・送信
- `app/history/detail.tsx` — 履歴詳細（全文表示・再利用・削除・共有・コピー）
- `app/settings/account.tsx` — アカウント管理（Gmail OAuth連携対応）
- `app/settings/plan.tsx` — プラン・課金（RevenueCat連携対応）
- `app/settings/privacy.tsx` — プライバシーポリシー
- `app/settings/presets.tsx` — プリセット管理（準備中）
- `app/settings/learning-data.tsx` — 学習データ管理（準備中）

### State Management (Zustand)

- `store/use-auth-store.ts` — ユーザー認証、メールアカウント管理、月次クォータ
- `store/use-mail-store.ts` — メール作成状態、履歴管理（CRUD）
- `store/use-contact-store.ts` — 連絡先CRUD
- `store/use-plan-store.ts` — プラン状態、RevenueCat同期

### Lib (Business Logic)

- `lib/mail-generator.ts` — AI メール生成（Supabase Edge Function 経由 OpenAI GPT）
- `lib/mail-generator.mock.ts` — モックメール生成
- `lib/mail-sender.ts` — メール送信（Gmail API 対応、モックフォールバック）
- `lib/google-auth.ts` — Google OAuth 2.0 認証（expo-auth-session）
- `lib/purchases.ts` — RevenueCat 課金管理
- `lib/templates.ts` — テンプレートデータ管理
- `lib/api.ts` — API クライアント
- `lib/supabase.ts` — Supabase クライアント

### Supabase Edge Functions

- `supabase/functions/generate-mail/` — OpenAI GPT でメール生成
- `supabase/functions/send-mail/` — Gmail API 経由でメール送信

### Theming

- `constants/theme.ts` — Colors (light/dark), Fonts (platform-specific)
- `hooks/use-color-scheme.ts` / `.web.ts` — Platform-specific color scheme
- `components/themed-text.tsx` / `themed-view.tsx` — Theme-aware base components

### Key patterns

- Path alias: `@/` maps to project root
- `HapticTab` component provides iOS haptic feedback
- Animations use `react-native-reanimated` (v4)
- OAuth tokens stored in `expo-secure-store`
- RevenueCat for IAP, falls back to mock when API key not set
- Gmail OAuth falls back to mock when Google Client ID not set

### Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL          — Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY     — Supabase anonymous key
EXPO_PUBLIC_USE_MOCK_AI           — "true" to use mock AI generation
EXPO_PUBLIC_GOOGLE_CLIENT_ID      — Google OAuth Client ID (optional)
EXPO_PUBLIC_REVENUECAT_IOS_KEY    — RevenueCat iOS API key (optional)
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY — RevenueCat Android API key (optional)
EXPO_PUBLIC_SENTRY_DSN             — Sentry DSN for crash reporting (optional)
```

## Tech stack summary

Expo 54 | React 19 | React Native 0.81 | Expo Router 6 | React Navigation 7 | Reanimated 4 | Zustand 5 | Supabase | RevenueCat | Sentry | TypeScript 5.9 (strict) | ESLint with expo config
