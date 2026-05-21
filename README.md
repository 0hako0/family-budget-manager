# Family Budget Manager

夫婦で共有して使える家計運用アプリです。目的は細かい家計簿ではなく、「今月あといくら使えるか」「使いすぎ防止」「固定費見直し」「貯金・投資管理」を分かりやすくすることです。

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` に Supabase の値を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

`.env.local` はローカル開発用です。GitHubにはアップロードしないでください。Vercel本番環境では、VercelのEnvironment Variablesに同じ値を設定してください。

## 起動方法

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## Supabase設定

1. Supabaseでプロジェクトを作成します。
2. Project Settings → API から Project URL と publishable key を取得します。
3. `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定します。
4. Supabase SQL Editorで `supabase/schema.sql` を実行します。

## Vercel公開手順

1. このリポジトリをGitHubへpushします。
2. VercelでGitHubリポジトリをImportします。
3. Framework Preset は `Next.js` を選択します。
4. Vercelの Project Settings → Environment Variables に以下を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

5. Deployします。
6. デプロイ後に発行されたURLをiPhone Safariで開きます。
7. Safariの共有ボタンから「ホーム画面に追加」を選ぶと、アプリのように起動できます。

## iPhoneで使う手順

Vercelデプロイ後に発行されたURLをiPhone Safariで開きます。Safariの共有ボタンから「ホーム画面に追加」を選ぶと、PWAとしてホーム画面から起動できます。

## PWA対応

最低限のPWA対応として以下を設定済みです。

- `public/manifest.json`
- `theme-color`
- `apple-mobile-web-app-capable`
- iPhoneホーム画面追加対応
- safe-area-inset対応

## 主な機能

- ホーム: 今月あと使える金額、今日使える目安、月末予測
- 支出入力: 金額優先、カテゴリ選択、直近支出
- 固定費管理: 月額合計、年間換算、見直しメモ
- 収入管理
- 先取り貯金・投資管理
- ローン管理
- レポート: カテゴリ予算、月別推移、比率、月次比較
- 設定: 家計グループ、負担割合、カテゴリ編集、メンバー管理

## 今後のTODO

- Supabase実データ取得と登録処理
- Supabase Auth
- Row Level Security設定
- 夫婦招待機能
- 月締め保存
- カテゴリ編集の永続化
- 通知機能
