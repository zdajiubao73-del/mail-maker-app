# 024: Yahoo! / iCloudメール連携

## Phase
Phase 3 - 差別化強化

## 概要
Yahoo!メール（Yahoo! API）およびiCloudメール（Apple API）の連携を追加し、対応メールサービスを拡充する。

## TODO

### Yahoo!メール
- [ ] Yahoo! Developer でOAuthクライアントの作成
- [ ] Yahoo! OAuth 2.0 認証フローの実装
- [ ] Yahoo! API を使ったメール送信エンドポイント実装
- [ ] アカウント管理画面への追加

### iCloudメール
- [ ] Apple API のOAuth認証フローの調査・実装
- [ ] iCloudメール送信のエンドポイント実装
- [ ] アカウント管理画面への追加

### 共通
- [ ] 送信元アカウント選択UIに新サービスを追加
- [ ] メールサービス種別の判定・分岐ロジック

## 依存
- 015_Gmail連携（共通の認証・送信設計を踏襲）
- 020_Outlook連携

## 完了条件
- Yahoo!メールのOAuth認証・送信が動作する
- iCloudメールのOAuth認証・送信が動作する
- 全メールサービスがアカウント管理画面から管理できる
