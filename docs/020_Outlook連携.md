# 020: Outlook連携

## Phase
Phase 2 - 品質向上

## 概要
Microsoft Graph API を使ったOutlookメール送信機能を追加する。

## TODO

- [ ] Azure AD でOAuthクライアントの作成
- [ ] Microsoft OAuth 2.0 認証フローの実装
- [ ] アクセストークン・リフレッシュトークンの取得・保存
- [ ] バックエンドにOutlook送信エンドポイントの実装
  - [ ] Microsoft Graph API を使ったメール送信処理
- [ ] 送信元アカウント選択UIにOutlookを追加
- [ ] アカウント管理画面にOutlookアカウントの表示を追加

## 依存
- 015_Gmail連携（認証・送信の共通設計を踏襲）

## 完了条件
- Outlook OAuth認証が動作する
- Microsoft Graph API経由でメールが送信される
- Gmail同様にアカウント管理ができる
