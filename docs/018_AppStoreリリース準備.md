# 018: App Storeリリース準備

## Phase
Phase 1 - MVP

## 概要
App Store審査に必要なメタデータ・アセット・ビルド設定を整備し、審査に提出する。

## TODO

### アセット準備
- [ ] アプリアイコンの作成（1024x1024 + 各サイズ）
- [ ] スプラッシュ画面のデザイン
- [ ] App Storeスクリーンショットの作成（iPhone各サイズ）
- [ ] App Storeプレビュー動画の作成（任意）

### メタデータ
- [ ] アプリ名の決定
- [ ] サブタイトルの作成
- [ ] 説明文の作成（日本語）
- [ ] キーワードの設定
- [ ] カテゴリの選定
- [ ] サポートURL / プライバシーポリシーURLの準備

### ビルド・提出
- [ ] EAS Build の設定（eas.json）
- [ ] production ビルドプロファイルの構成
- [ ] Apple Developer Program のアカウント確認
- [ ] App Store Connect でアプリの登録
- [ ] TestFlight でのベータテスト
- [ ] 審査提出

### 審査対応
- [ ] App Store Review Guidelines の最終確認
- [ ] AI関連ガイドラインへの準拠確認
  - [ ] AI生成コンテンツの明示
  - [ ] ユーザーによる確認・編集機能の提供
  - [ ] 不適切出力のフィルタリング
- [ ] In-App Purchase のAppleガイドライン準拠確認

## 完了条件
- 全アセットが準備されている
- EAS Build でproductionビルドが成功する
- TestFlightでのテストが完了する
- App Storeに審査提出される
