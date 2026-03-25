# プロジェクト構成

## ディレクトリ構造

```
line-crm/
├── prisma/
│   └── schema.prisma              # Prisma データベーススキーマ定義
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhook/
│   │   │   │   └── route.ts       # LINE Webhook エンドポイント
│   │   │   │                      # イベント: follow, unfollow, message, postback
│   │   │   │
│   │   │   └── messages/
│   │   │       └── route.ts       # メッセージ CRUD API
│   │   │                          # GET: メッセージ一覧取得
│   │   │                          # POST: メッセージ作成
│   │   │
│   │   ├── analytics/
│   │   │   └── page.tsx           # 分析ダッシュボード
│   │   │                          # メッセージ配信統計
│   │   │                          # イベント履歴表示
│   │   │
│   │   ├── customers/
│   │   │   └── page.tsx           # 顧客管理ページ
│   │   │                          # ユーザー一覧表示
│   │   │                          # ステータス、タグ表示
│   │   │
│   │   ├── messages/
│   │   │   └── page.tsx           # メッセージ管理ページ
│   │   │                          # メッセージ一覧
│   │   │                          # メッセージ作成フォーム
│   │   │
│   │   ├── layout.tsx             # ルートレイアウト
│   │   │                          # サイドバーナビゲーション
│   │   │                          # 共通スタイル適用
│   │   │
│   │   ├── page.tsx               # ダッシュボード (/)
│   │   │                          # KPI 統計表示
│   │   │                          # クイックアクション
│   │   │
│   │   └── globals.css            # グローバルスタイル
│   │
│   └── lib/
│       ├── line.ts                # LINE Bot SDK 初期化
│       │                          # Client インスタンス作成
│       │
│       └── prisma.ts              # Prisma Client シングルトン
│                                  # 開発環境でのホットリロード対応
│
├── .env.example                   # 環境変数テンプレート
├── .gitignore                     # Git 無視設定
├── next.config.js                 # Next.js 設定
├── package.json                   # 依存パッケージ定義
├── postcss.config.js              # PostCSS 設定 (Tailwind)
├── tailwind.config.ts             # Tailwind CSS 設定
├── tsconfig.json                  # TypeScript 設定
├── README.md                       # プロジェクト説明書
├── SETUP.md                       # セットアップガイド
└── PROJECT_STRUCTURE.md           # このファイル
```

## ファイル説明

### 設定ファイル

| ファイル | 説明 |
|---------|------|
| `package.json` | npm 依存パッケージと実行スクリプト |
| `tsconfig.json` | TypeScript コンパイラ設定 |
| `next.config.js` | Next.js ビルド・実行時設定 |
| `tailwind.config.ts` | Tailwind CSS カスタマイズ設定 |
| `postcss.config.js` | PostCSS プラグイン設定 |
| `.env.example` | 環境変数テンプレート（リポジトリに含める） |
| `.gitignore` | Git 無視ファイル設定 |

### ソースコード

#### `src/lib/` - ユーティリティ

| ファイル | 説明 | 主な機能 |
|---------|------|--------|
| `prisma.ts` | Prisma ORM クライアント | DB アクセス、シングルトンパターン |
| `line.ts` | LINE Bot SDK クライアント | LINE API との通信 |

#### `src/app/` - Next.js App Router

| ファイル | 説明 | 主な機能 |
|---------|------|--------|
| `layout.tsx` | ルートレイアウト | サイドバー、ナビゲーション、全ページ共通 UI |
| `page.tsx` | ダッシュボード | KPI 表示、クイックアクション |
| `globals.css` | グローバルスタイル | Tailwind CSS インポート |
| `customers/page.tsx` | 顧客管理 | ユーザー一覧、フィルタリング、ステータス表示 |
| `messages/page.tsx` | メッセージ管理 | メッセージ作成フォーム、一覧表示 |
| `analytics/page.tsx` | 分析ダッシュボード | メッセージ統計、イベント履歴 |
| `api/webhook/route.ts` | LINE Webhook | follow, unfollow, message, postback イベント処理 |
| `api/messages/route.ts` | メッセージ API | CRUD 操作 |

### データベース

| ファイル | 説明 |
|---------|------|
| `prisma/schema.prisma` | DB スキーマ定義（6 モデル） |

## データモデル

### User（ユーザー/顧客）
```
User
├── id (CUID)
├── lineUserId (Unique)
├── displayName
├── pictureUrl
├── statusMessage
├── followedAt
├── unfollowedAt
├── isBlocked
├── createdAt
├── updatedAt
├── tags (UserTag[])
└── messageEvents (MessageEvent[])
```

### Message（メッセージ）
```
Message
├── id (CUID)
├── title
├── content
├── type (TEXT | FLEX | IMAGE)
├── segmentFilter
├── sentAt
├── sentCount
├── createdAt
├── updatedAt
└── messageEvents (MessageEvent[])
```

### MessageEvent（イベント）
```
MessageEvent
├── id (CUID)
├── messageId (FK)
├── lineUserId (FK)
├── eventType (DELIVERED | OPENED | CLICKED)
└── createdAt
```

### Segment（セグメント）
```
Segment
├── id (CUID)
├── name (Unique)
├── description
├── conditions (JSON)
├── createdAt
└── updatedAt
```

### Tag（タグ）
```
Tag
├── id (CUID)
├── name (Unique)
├── color (HEX)
├── createdAt
└── userTags (UserTag[])
```

### UserTag（ユーザータグ関連）
```
UserTag
├── id (CUID)
├── userId (FK)
├── tagId (FK)
└── unique([userId, tagId])
```

## API エンドポイント

### Webhook
- **POST** `/api/webhook`
  - LINE Messaging API から呼び出し
  - イベント: follow, unfollow, message, postback

### メッセージ
- **GET** `/api/messages`
  - メッセージ一覧取得（最新 50件）
- **POST** `/api/messages`
  - 新規メッセージ作成

## ナビゲーション構造

```
Dashboard (/)
├── Customers (/customers)
├── Messages (/messages)
└── Analytics (/analytics)
```

## スタイリング

- **フレームワーク**: Tailwind CSS
- **カラースキーム**:
  - LINE Green: `#00B900` (line-green)
  - Dark: `#111111` (line-dark)
  - Light: `#F5F5F5` (line-light)

## 環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `LINE_CHANNEL_SECRET` | LINE Channel Secret | ✓ |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token | ✓ |
| `DATABASE_URL` | データベース接続 URL | ✓ |
| `NEXT_PUBLIC_API_URL` | API ベース URL | (オプション) |

## 依存パッケージ

### Runtime
- `next@^14.1.0` - React フレームワーク
- `react@^18.2.0` - UI ライブラリ
- `@line/bot-sdk@^7.20.0` - LINE Messaging API
- `@prisma/client@^5.8.0` - ORM

### Dev Tools
- `typescript@^5.3.3` - 言語
- `tailwindcss@^3.4.1` - CSS フレームワーク
- `prisma@^5.8.0` - ORM CLI
- `autoprefixer@^10.4.17` - CSS ベンダープレフィックス

## 開発フロー

1. **初期セットアップ**
   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **開発サーバー起動**
   ```bash
   npm run dev
   ```

3. **コードの修正**
   - ファイルを編集
   - ホットリロードで自動更新

4. **スキーマ変更**
   ```bash
   npm run prisma:migrate
   ```

5. **本番ビルド**
   ```bash
   npm run build
   npm start
   ```

## 拡張ポイント

### すぐに実装できる機能

1. **セグメント管理ページ** (`/segments`)
   - セグメント一覧、作成、編集、削除

2. **タグ管理ページ** (`/tags`)
   - タグ一覧、作成、編集、削除

3. **メッセージ配信スケジューリング**
   - `sentAt` をスケジュール日時に設定
   - バックグラウンドジョブで配信実行

4. **ユーザー詳細ページ** (`/customers/[id]`)
   - ユーザー情報表示
   - メッセージ履歴表示
   - タグ・セグメント管理

5. **レポート生成**
   - CSV エクスポート
   - PDF レポート

## パフォーマンス最適化

- **サーバーサイドレンダリング (SSR)** で SEO 最適化
- **Prisma インデックス** でデータベース高速化
- **キャッシング戦略** で API レスポンス高速化
- **画像最適化** で Lighthouse スコア改善

## セキュリティ

- LINE Webhook 署名検証
- 環境変数による認証情報管理
- TypeScript による型安全性
- SQL インジェクション 対策 (Prisma ORM)

## ログ・デバッグ

- Prisma ログレベル: `query`, `error`, `warn`
- Console ログ出力
- ネットワークタブで API 通信確認
- Prisma Studio でデータベース確認

```bash
npm run prisma:studio
```
