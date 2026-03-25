# セットアップガイド

LINE CRM プロジェクトの初期セットアップ手順です。

## 前提条件

- Node.js 18 以上
- npm または yarn
- LINE Developers アカウント

## ステップ 1: LINE Channel の作成

1. [LINE Developers Console](https://developers.line.biz/ja/) にアクセス
2. 新しい Provider を作成
3. Messaging API Channel を作成
4. Channel Settings で以下を取得:
   - Channel Secret (LINE_CHANNEL_SECRET)
   - Channel Access Token (LINE_CHANNEL_ACCESS_TOKEN)

## ステップ 2: プロジェクト初期化

```bash
# 依存パッケージをインストール
npm install

# Prisma クライアントを生成
npm run prisma:generate
```

## ステップ 3: 環境変数設定

```bash
# .env ファイルを作成
cp .env.example .env

# エディタで .env を開いて LINE API 認証情報を入力
# LINE_CHANNEL_SECRET=<ここに入力>
# LINE_CHANNEL_ACCESS_TOKEN=<ここに入力>
```

## ステップ 4: データベース初期化

```bash
# Prisma マイグレーション実行
npm run prisma:migrate

# プロンプトが表示されたら、マイグレーション名を入力 (例: init)
```

## ステップ 5: 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてダッシュボードが表示されることを確認

## ステップ 6: Webhook の設定

### ローカル開発環境での設定

#### ngrok を使用する場合

```bash
# 別のターミナルで ngrok を起動
ngrok http 3000

# 出力された URL (例: https://abcd1234.ngrok.io) をコピー
```

#### Cloudflare Tunnel を使用する場合

```bash
# Cloudflare CLI をインストール
npm install -g wrangler

# トンネルを開始
cloudflared tunnel --url http://localhost:3000
```

### LINE Developers Console での設定

1. LINE Developers Console にログイン
2. Messaging API settings を開く
3. Webhook URL に以下のように設定:
   ```
   https://your-ngrok-url.ngrok.io/api/webhook
   ```
4. "Use webhook" を有効化
5. "Verify" をクリックして接続確認

## テスト

### Webhook が正常に動作しているか確認

1. LINE 公式アカウント設定から QR コードを生成
2. スマートフォンから QR コードをスキャンして友だち追加
3. LINE CRM の顧客ページで新規ユーザーが追加されているか確認

### メッセージ作成テスト

1. ダッシュボードから「メッセージを作成」をクリック
2. テストメッセージを入力して保存
3. メッセージページで作成したメッセージが表示されることを確認

## 本番環境へのデプロイ

### Vercel を使用する場合

```bash
# 1. Vercel アカウントを作成
# https://vercel.com

# 2. Vercel CLI をインストール
npm i -g vercel

# 3. Vercel にログイン
vercel login

# 4. プロジェクトをデプロイ
vercel

# 5. 環境変数を設定
# Vercel ダッシュボード → Settings → Environment Variables
# 以下を追加:
# LINE_CHANNEL_SECRET
# LINE_CHANNEL_ACCESS_TOKEN
# DATABASE_URL (PostgreSQL の場合)

# 6. デプロイ URL を取得
# https://your-project-name.vercel.app

# 7. LINE Developers Console で Webhook URL を更新
# https://your-project-name.vercel.app/api/webhook
```

### Railway を使用する場合

```bash
# 1. Railway アカウントを作成
# https://railway.app

# 2. Railway から新しいプロジェクトを作成
# GitHub リポジトリを接続

# 3. PostgreSQL プラグインを追加
# Database → Add → PostgreSQL

# 4. 環境変数を設定
# LINE_CHANNEL_SECRET
# LINE_CHANNEL_ACCESS_TOKEN
# DATABASE_URL (自動設定される)

# 5. デプロイ
```

### PostgreSQL への移行

本番環境では SQLite ではなく PostgreSQL を推奨します。

```bash
# 1. prisma/schema.prisma を編集
# provider = "postgresql" に変更

# 2. データベース接続情報を .env に設定
DATABASE_URL="postgresql://user:password@localhost:5432/line_crm"

# 3. マイグレーション実行
npm run prisma:migrate

# 4. データベースが正常に動作しているか確認
npm run prisma:studio
```

## 一般的なエラーと対応

### "Cannot find module '@line/bot-sdk'"

```bash
npm install @line/bot-sdk
```

### "PrismaClientInitializationError: Can't reach database server"

- DATABASE_URL が正しく設定されているか確認
- データベースサーバーが起動しているか確認
- SQLite の場合、ファイルパスの権限を確認

### Webhook で "401 Unauthorized"

- LINE_CHANNEL_SECRET が正しく設定されているか確認
- LINE Developers Console で Webhook URL が正しいか確認
- ngrok などのトンネルが接続されているか確認

### メッセージが送信されない

- LINE_CHANNEL_ACCESS_TOKEN が有効か確認
- LINE 公式アカウントが有効化されているか確認
- 友だちが正しく登録されているか確認

## 次のステップ

1. **セグメント機能の実装**: 顧客グループの作成と管理
2. **メッセージ配信スケジューリング**: 定時配信機能
3. **高度な分析**: 顧客エンゲージメント分析
4. **自動化**: 特定のイベントに基づくメッセージトリガー

## サポート

問題が発生した場合:

1. Console で エラーメッセージを確認
2. README.md のトラブルシューティングセクションを参照
3. GitHub Issues で報告
