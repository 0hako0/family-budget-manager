const japaneseMessages: Array<[RegExp, string]> = [
  [/email not confirmed/i, "このアカウントは確認待ち状態です。再登録するか管理者に確認してください。"],
  [/rate limit/i, "しばらく時間をおいてからもう一度お試しください。"],
  [/invalid login credentials/i, "メールアドレスまたはパスワードが正しくありません。"],
  [/password/i, "パスワードを確認してください。6文字以上で入力してください。"],
  [/duplicate key|unique constraint/i, "すでに登録済みのデータです。内容を確認してください。"],
  [/row-level security|rls/i, "この家計データを操作する権限がありません。ログイン状態と家計グループを確認してください。"],
  [/not authenticated|jwt|session/i, "ログイン状態を確認できませんでした。もう一度ログインしてください。"],
  [/invite|code|not found|家計コード/i, "家計コードが見つかりません。コードを確認してください。"],
  [/null value|not-null/i, "必須項目が入力されていません。内容を確認してください。"],
  [/violates check constraint|check constraint/i, "入力値が条件を満たしていません。日付や金額を確認してください。"],
  [/foreign key/i, "関連するデータが見つかりません。画面を更新してもう一度お試しください。"],
  [/network|fetch/i, "通信に失敗しました。ネットワーク接続を確認してください。"]
];

export function toJapaneseError(message?: string | null) {
  const text = String(message ?? "").trim();
  if (!text) return "エラーが発生しました。もう一度お試しください。";
  const matched = japaneseMessages.find(([pattern]) => pattern.test(text));
  return matched?.[1] ?? "保存に失敗しました。入力内容を確認して、もう一度お試しください。";
}
