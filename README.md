# KakeiCanvas

iPhone利用を最優先にした、夫婦共有向けの家計運用アプリです。家計簿を細かく記録するよりも、「今月あといくら使えるか」「使いすぎ防止」「固定費見直し」「貯金・投資管理」を分かりやすくすることに寄せています。

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
5. Authentication → Providers → Email を有効にします。
6. Email Provider の `Confirm email` は OFF にしてください。このアプリはメール確認、magic link、招待メールを使わず、メールアドレス + パスワード認証と家計コード共有で運用します。

既存DBへ追加変更だけ反映したい場合は、`supabase/migrations/` のSQLを番号順に実行してください。

## 夫婦共有の使い方

1. 夫または妻が新規登録します。
2. 初回セットアップで家計グループを作成します。
3. 設定 → パートナー招待 で招待コードを作成します。
4. パートナーは新規登録またはログイン後、初回セットアップ画面で招待コードを入力します。
5. 入力後、同じ `household_group_id` のデータだけが表示・編集されます。

Supabase Realtimeを有効にすると、支出・カテゴリなどの変更が相手側にも自動反映されます。最低限、画面再読み込みでも同期されます。

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

## PWA対応

最低限のPWA対応を入れています。

- `public/manifest.json`
- `theme-color`
- `apple-mobile-web-app-capable`
- iPhoneホーム画面追加対応
- safe-area-inset対応

## 主な機能

- Supabase Authによるユーザー登録、ログイン、ログアウト
- 家計グループ作成
- 招待コードによるパートナー参加
- 設定画面で招待コードを常時表示
- RLSによる家計グループ単位のデータ保護
- ホーム: 今月あと使える金額、今日使える目安、月末予測
- 支出入力: 金額優先、カテゴリ選択、iPhone向け固定登録ボタン
- 固定費管理、収入管理、貯金・投資管理、ローン管理
- 収入・固定費などの編集と削除
- カテゴリ追加・編集・非表示・アーカイブ
- カテゴリ別予算
- 月次履歴・比較表示
- 月締めサマリー保存
- iPhone向け下部タブナビゲーション

## 今後のTODO

- 招待コードの再発行・失効管理
- メンバーごとの負担割合編集
- Supabase Realtimeの本番設定ガイド追加
- 通知機能（カテゴリ予算超過、固定費見直し通知など）
