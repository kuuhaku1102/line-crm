# LINE CRM

LINE Messaging API を統合したカスタマー管理システムです。Next.js と Prisma を使用した、シンプルで拡張性の高い CRM プラットフォームです。

## 機能

- 👥 **顧客管理**: LINE 友だちの管理とセグメンテーション
- 💬 **メッセージ配信**: テキスト、Flex Message、画像配信に対応
- 📊 **ダッシュボード**: リアルタイム統計とメトリクス
- 📈 **分析**: メッセージ配信分析とイベント追跡
- 🏷️ **タグ・セグメント**: 顧客の分類と配信対象管理

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Prisma ORM (開発環境では SQLite、本番環境では PostgreSQL 推奨)
- **LINE API**: @line/bot-sdk
- **ランタイム**: Node.js

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd line-crm
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、LINE API の認証情報を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを編集して以下を設定します:

```
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
DATABASE_URL="file:./dev.db"
```

LINE Messaging API の認証情報は、[LINE Developers Console](https://developers.line.biz/ja/) から取得できます。

### 4. データベースのセットアップ

Prisma マイグレーションを実行します:

```bash
npm run prisma:migrate
```

または開発環境でのみ使用する場合:

```bash
npx prisma migrate dev
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## Webhook の設定

LINE Developers Console で Webhook URL を以下に設定してください:

```
https://your-domain.com/api/webhook
```

ローカル開発環境では、以下のようなサービスを使用してトンネルを作成できます:
- ngrok
- Cloudflare Tunnel
- localtunnel

### ngrok の例

```bash
ngrok http 3000
```

出力された URL を LINE Developers Console に設定します。

## ディレクトリ構造

```
line-crm/
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhook/       # LINE Webhook エンドポイント
│   │   │   └── messages/      # メッセージ API
│   │   ├── analytics/         # 分析ページ
│   │   ├── customers/         # 顧客管理ページ
│   │   ├── messages/          # メッセージ管理ページ
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # ダッシュボード
│   │   └── globals.css        # グローバルスタイル
│   └── lib/
│       ├── line.ts            # LINE クライアント設定
│       └── prisma.ts          # Prisma クライアント
├── .env.example               # 環境変数テンプレート
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 使用可能なコマンド

```bash
# 開発サーバーの起動
npm run dev

# 本番用ビルド
npm run build

# 本番サーバーの起動
npm start

# Lint チェック
npm run lint

# Prisma クライアントの生成
npm run prisma:generate

# マイグレーション実行
npm run prisma:migrate

# Prisma Studio (GUI) を開く
npm run prisma:studio
```

## データベーススキーマ

### User (ユーザー/顧客)
- lineUserId: LINE ユーザー ID (ユニーク)
- displayName: 表示名
- pictureUrl: プロフィール画像 URL
- statusMessage: ステータスメッセージ
- followedAt: フォロー日時
- unfollowedAt: フォロー解除日時
- isBlocked: ブロック状態
- tags: 関連タグ (リレーション)

### Message (メッセージ)
- title: メッセージタイトル
- content: メッセージ本文
- type: メッセージタイプ (TEXT / FLEX / IMAGE)
- segmentFilter: 配信対象セグメント (JSON)
- sentAt: 配信日時
- sentCount: 配信数
- messageEvents: 関連イベント (リレーション)

### MessageEvent (メッセージイベント)
- messageId: メッセージ ID (リレーション)
- lineUserId: ユーザー ID (リレーション)
- eventType: イベントタイプ (DELIVERED / OPENED / CLICKED)

### Segment (セグメント)
- name: セグメント名
- description: 説明
- conditions: フィルター条件 (JSON)

### Tag (タグ)
- name: タグ名
- color: 表示色 (16進カラーコード)
- userTags: ユーザーとの関連 (リレーション)

## Webhook イベント処理

現在対応しているイベント:

- **follow**: ユーザーが友だち追加したとき
- **unfollow**: ユーザーが友だち削除したとき
- **message**: ユーザーがメッセージを送信したとき
- **postback**: ボタンクリックなどのポストバックイベント

## 本番環境へのデプロイ

### Vercel での例

```bash
# Vercel CLI のインストール
npm i -g vercel

# デプロイ
vercel
```

### PostgreSQL への切り替え

1. `prisma/schema.prisma` で datasource を変更:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. `.env` で DATABASE_URL を設定:

```
DATABASE_URL="postgresql://user:password@localhost:5432/line_crm"
```

3. マイグレーション実行:

```bash
npm run prisma:migrate
```

## トラブルシューティング

### Webhook が受け取れない場合

1. LINE Developers Console で Webhook URL が正しく設定されているか確認
2. Webhook が有効になっているか確認
3. ngrok などでトンネルが接続されているか確認
4. ネットワークログで署名検証が失敗していないか確認

### データベースエラー

```bash
# Prisma Studio で確認
npm run prisma:studio

# マイグレーションを再実行
npm run prisma:migrate
```

## セキュリティに関する注意

- `LINE_CHANNEL_SECRET` と `LINE_CHANNEL_ACCESS_TOKEN` は絶対に公開リポジトリにコミットしないでください
- `.env` ファイルは `.gitignore` に含まれています
- Webhook の署名検証は必ず実装してください

## ライセンス

MIT

## サポート

問題が発生した場合は、GitHub Issues でお知らせください。

## 参考リンク

- [LINE Messaging API Documentation](https://developers.line.biz/ja/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
