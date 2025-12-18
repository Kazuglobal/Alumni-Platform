# Alumni Platform

同窓会プラットフォームのマルチテナント管理システム

## 必要な環境

- Node.js 18以上
- pnpm（推奨）または npm
- Docker と Docker Compose（ローカルデータベースを使用する場合）

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース接続URL
# ローカルPostgreSQLの場合（Docker使用時）
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alumni_platform?schema=public"

# リモートPostgreSQLの場合の例
# DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Vercel連携（オプション）
# VERCEL_API_TOKEN="your_vercel_api_token"
# VERCEL_TEAM_ID="your_vercel_team_id"

# アプリケーション設定
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_ROOT_DOMAIN="localhost"

# 環境
NODE_ENV="development"
```

### 3. データベースの起動

#### Docker Composeを使用する場合（推奨）

```bash
# データベースを起動
docker-compose up -d

# データベースを停止
docker-compose down

# データベースを停止してボリュームも削除（データが消えます）
docker-compose down -v
```

#### 既存のPostgreSQLを使用する場合

`DATABASE_URL` を既存のPostgreSQLサーバーに合わせて設定してください。

### 4. データベースのマイグレーション

```bash
# Prismaクライアントを生成
pnpm db:generate

# データベーススキーマを適用
pnpm db:push

# または、マイグレーションを使用する場合
pnpm db:migrate
```

### 5. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## よくある問題

### データベース接続エラー

エラーメッセージ: `Can't reach database server at localhost:5432`

**対処方法:**

1. Docker Composeを使用している場合:
   ```bash
   docker-compose up -d
   ```
   データベースコンテナが起動しているか確認:
   ```bash
   docker-compose ps
   ```

2. 環境変数 `DATABASE_URL` が正しく設定されているか確認:
   - `.env.local` ファイルが存在するか
   - `DATABASE_URL` の値が正しいか（ホスト、ポート、データベース名、認証情報）

3. PostgreSQLサーバーが `localhost:5432` で起動しているか確認:
   ```bash
   # Docker Composeの場合
   docker-compose ps
   
   # ローカルPostgreSQLの場合
   # Windows: サービス管理から確認
   # macOS/Linux: sudo systemctl status postgresql
   ```

## 利用可能なスクリプト

- `pnpm dev` - 開発サーバーを起動
- `pnpm build` - 本番用ビルド
- `pnpm start` - 本番サーバーを起動
- `pnpm lint` - ESLintでコードをチェック
- `pnpm db:generate` - Prismaクライアントを生成
- `pnpm db:push` - データベーススキーマを適用（開発用）
- `pnpm db:migrate` - マイグレーションを実行
- `pnpm db:studio` - Prisma Studioを起動（データベースGUI）

## プロジェクト構造

```
almni-platform/
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # 管理画面
│   │   └── [domain]/          # テナント別ルーティング
│   ├── components/            # Reactコンポーネント
│   ├── lib/                   # ユーティリティ・ライブラリ
│   └── middleware.ts          # Next.jsミドルウェア
├── docker-compose.yml         # Docker Compose設定
└── README.md                  # このファイル
```

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **スタイリング**: Tailwind CSS
- **パッケージマネージャー**: pnpm












