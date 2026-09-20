"use client";

export type ReceiptOcrResult = {
  text: string;
  confidence: number;
  amountGuess?: number;
};

const totalKeywordPattern = /(合計|ご請求|お会計|お買上げ|total)/i;
const amountPattern = /[¥￥]?\s?([0-9][0-9,，]{1,9})\s?円?/g;

function extractAmounts(line: string): number[] {
  const amounts: number[] = [];
  const pattern = new RegExp(amountPattern.source, amountPattern.flags);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line)) !== null) {
    const amount = Number(match[1].replace(/[,，]/g, ""));
    if (Number.isFinite(amount) && amount > 0) amounts.push(amount);
  }
  return amounts;
}

/** 合計行を優先し、見つからなければ本文中の最大金額をレシート金額の推測値とする。参考値であり確定値ではない。 */
export function guessAmountFromReceiptText(text: string): number | undefined {
  const lines = text.split(/\r?\n/);
  const totalLineAmounts = lines.filter((line) => totalKeywordPattern.test(line)).flatMap(extractAmounts);
  if (totalLineAmounts.length > 0) return Math.max(...totalLineAmounts);

  const allAmounts = extractAmounts(text);
  if (allAmounts.length === 0) return undefined;
  return Math.max(...allAmounts);
}

/** レシート画像から文字を読み取る（クライアント側OCR、外部APIやサーバーは使わない）。 */
export async function recognizeReceiptText(blob: Blob): Promise<ReceiptOcrResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("jpn");
  try {
    const { data } = await worker.recognize(blob);
    const text = data.text.trim();
    return { text, confidence: Math.round(data.confidence), amountGuess: guessAmountFromReceiptText(text) };
  } finally {
    await worker.terminate();
  }
}
