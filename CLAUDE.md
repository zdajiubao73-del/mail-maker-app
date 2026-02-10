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

- `app/_layout.tsx` — Root Stack navigator with theme provider (light/dark from system)
- `app/(tabs)/_layout.tsx` — Bottom tab navigator (Home + Explore tabs)
- `app/(tabs)/index.tsx` — Home tab
- `app/(tabs)/explore.tsx` — Explore tab
- `app/modal.tsx` — Modal screen presented over stack

Typed routes are enabled (`experiments.typedRoutes` in app.json), so route names are type-checked.

### Theming

- `constants/theme.ts` — Defines `Colors` (light/dark palettes) and `Fonts` (platform-specific font families)
- `hooks/use-color-scheme.ts` / `.web.ts` — Platform-specific color scheme detection
- `hooks/use-theme-color.ts` — Resolves a color value based on current theme
- `components/themed-text.tsx` / `themed-view.tsx` — Theme-aware base components

### Platform-specific files

Uses React Native's `.ios.tsx` / `.web.ts` suffix convention:
- `components/ui/icon-symbol.ios.tsx` — SF Symbols on iOS, Material Icons elsewhere
- `hooks/use-color-scheme.web.ts` — Web-specific color scheme hook

### Key patterns

- Animations use `react-native-reanimated` (v4) — see `hello-wave.tsx`, `parallax-scroll-view.tsx`
- `HapticTab` component provides iOS haptic feedback on tab press
- `ExternalLink` opens URLs via `expo-web-browser` on native, standard anchor on web
- Path alias: `@/` maps to project root (configured in tsconfig.json)

### Experimental features enabled

- React Compiler (`experiments.reactCompiler` in app.json)
- New Architecture (`newArchEnabled: true`)

## Tech stack summary

Expo 54 | React 19 | React Native 0.81 | Expo Router 6 | React Navigation 7 | Reanimated 4 | TypeScript 5.9 (strict) | ESLint with expo config
