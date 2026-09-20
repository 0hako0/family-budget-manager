"use client";

import { loadImage } from "@/lib/receipt-image";

export type ReceiptLineItem = {
  name: string;
  price: number;
};

export type ReceiptOcrResult = {
  text: string;
  confidence: number;
  amountGuess?: number;
  items: ReceiptLineItem[];
};

/** レシートに実際にありそうな金額の上限。登録番号・電話番号など無関係な数字を除外するための目安。 */
const MAX_PLAUSIBLE_AMOUNT = 500000;

/** 合計金額とは無関係な数字が乗りやすい行（登録番号・電話番号・会員番号・商品バーコードなど）。 */
const excludeAmountLinePattern = /(登録番号|電話|tel|fax|会員番号|ポイント|point|no\.|レジ|責任者|〒|http|jan)/i;
/** レシートの「合計」行。先頭が合計であることを条件にし、「商品合計」「値引合計」などの内訳行と区別する。 */
const primaryTotalLinePattern = /^\s*合\s*計/;
/** 「合計」が見当たらない場合の次点キーワード。 */
const secondaryTotalKeywordPattern = /(ご請求|お会計|お買上げ|total|お支払|支払)/i;
/** 商品番号・バーコード行（例:「#022 JAN4983771125171」）。金額にも商品明細にも使わない。 */
const codeLinePattern = /^\s*#/;

const amountPattern = /[¥￥]?\s?([0-9][0-9,，]{0,6})\s?円?/g;

function normalizeFullWidthDigits(text: string): string {
  return text
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[，]/g, ",");
}

function extractAmounts(line: string): number[] {
  const amounts: number[] = [];
  const pattern = new RegExp(amountPattern.source, amountPattern.flags);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line)) !== null) {
    const amount = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(amount) && amount > 0 && amount <= MAX_PLAUSIBLE_AMOUNT) amounts.push(amount);
  }
  return amounts;
}

/**
 * 「合計」行を最優先し、次に「ご請求」等のキーワード行、それでも見つからなければ本文中の最大金額を使う。
 * 登録番号や電話番号など明らかに金額ではない行・桁数の大きすぎる数字は候補から除外する。参考値であり確定値ではない。
 */
export function guessAmountFromReceiptText(text: string): number | undefined {
  const lines = normalizeFullWidthDigits(text)
    .split(/\r?\n/)
    .filter((line) => !excludeAmountLinePattern.test(line) && !codeLinePattern.test(line));

  // 「合計　1　¥5,478」のように数量列が挟まる書式があるため、行内の最大値を金額とみなす（数量は通常ごく小さい数）。
  const primaryLineAmounts = lines.filter((line) => primaryTotalLinePattern.test(line)).flatMap(extractAmounts);
  if (primaryLineAmounts.length > 0) return Math.max(...primaryLineAmounts);

  const secondaryLineAmounts = lines.filter((line) => secondaryTotalKeywordPattern.test(line)).flatMap(extractAmounts);
  if (secondaryLineAmounts.length > 0) return Math.max(...secondaryLineAmounts);

  const allAmounts = lines.flatMap(extractAmounts);
  if (allAmounts.length === 0) return undefined;
  return Math.max(...allAmounts);
}

/** 商品明細としては扱わない行（合計・小計・税・支払い方法・店舗情報・日付時刻など）。 */
const excludeItemLinePattern =
  /(合\s*計|小\s*計|税|預か|お釣|point|ポイント|jan|カード|現金|クレジット|ペイ|支払|レシート|領収|ありがとう|様|tel|電話|〒|http|登録番号|クーポン|割引|会員|レジ|責任者|営業時間|住所|店$|\d{4}年|\d{1,2}:\d{2})/i;
const lineItemPattern = /^(.{2,30}?)[\s　]*[¥￥]?\s?([0-9][0-9,]{0,6})\s?(?:円|軽|内|税)?\*?\s*$/;
/** 金額らしき数字だけの行（商品名が改行で分かれている場合、直前の行を商品名として結びつける）。 */
const priceOnlyLinePattern = /^[\s　]*[¥￥]?\s?([0-9][0-9,]{0,6})\s?(?:円|軽|内|税)?\*?\s*$/;

function isSkippableItemLine(line: string): boolean {
  return !line || /^[（(]/.test(line) || /-\s*[0-9]/.test(line) || excludeItemLinePattern.test(line) || codeLinePattern.test(line);
}

/** 数字・記号だけの文字列は商品名として扱わない（金額の断片を誤って商品名にしてしまうのを防ぐ）。 */
function hasMeaningfulName(text: string): boolean {
  return /[^\d,.\s]/.test(text);
}

/**
 * レシートの品目らしき行から「商品名・金額」の対を拾う。同じ行に名前と金額がある形式に加え、
 * 幅の狭いレシートで商品名と金額が改行で分かれる形式（前の行を商品名として結びつける）にも対応する。
 * 誤検出はあり得るため、保存前に利用者が確認・編集できるようにする。
 */
export function extractLineItemsFromReceiptText(text: string): ReceiptLineItem[] {
  const lines = normalizeFullWidthDigits(text)
    .split(/\r?\n/)
    .map((line) => line.trim());
  const items: ReceiptLineItem[] = [];
  let pendingName: string | null = null;

  for (const line of lines) {
    if (isSkippableItemLine(line)) {
      pendingName = null;
      continue;
    }

    // 行全体が金額だけ（先頭にきちんとした商品名がない）場合を先に判定する。そうしないと
    // 「5,478内」のような行が非貪欲マッチで「5,」を商品名、「478」を金額と誤って分割してしまう。
    const priceOnlyMatch = line.match(priceOnlyLinePattern);
    if (priceOnlyMatch) {
      if (pendingName) {
        const price = Number(priceOnlyMatch[1].replace(/,/g, ""));
        if (Number.isFinite(price) && price > 0 && price <= MAX_PLAUSIBLE_AMOUNT) items.push({ name: pendingName, price });
      }
      pendingName = null;
      continue;
    }

    const inlineMatch = line.match(lineItemPattern);
    if (inlineMatch) {
      const name = inlineMatch[1].replace(/[.\-_*　\s]+$/g, "").trim();
      const price = Number(inlineMatch[2].replace(/,/g, ""));
      if (name.length >= 2 && hasMeaningfulName(name) && Number.isFinite(price) && price > 0 && price <= MAX_PLAUSIBLE_AMOUNT) {
        items.push({ name, price });
      }
      pendingName = null;
      continue;
    }

    pendingName = line.length >= 2 && line.length <= 30 && hasMeaningfulName(line) ? line : null;
  }

  return items.slice(0, 50);
}

/** OCR用に、保存する画像とは別に高解像度・グレースケール・高コントラストの画像を作る（小さい文字の読み取り精度を上げるため）。 */
async function prepareOcrImage(source: Blob, maxLongEdge = 1800): Promise<Blob> {
  const imageUrl = URL.createObjectURL(source);
  try {
    const image = await loadImage(imageUrl);
    const scale = Math.min(1, maxLongEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を処理できませんでした。");
    context.drawImage(image, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
      const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.6 + 128));
      pixels[i] = pixels[i + 1] = pixels[i + 2] = contrasted;
    }
    context.putImageData(imageData, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("画像を処理できませんでした。"))), "image/png");
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/** レシート画像から文字を読み取る（クライアント側OCR、外部APIやサーバーは使わない）。 */
export async function recognizeReceiptText(source: Blob): Promise<ReceiptOcrResult> {
  const { createWorker, PSM } = await import("tesseract.js");
  const ocrImage = await prepareOcrImage(source).catch(() => source);
  const worker = await createWorker("jpn");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const { data } = await worker.recognize(ocrImage);
    const text = data.text.trim();
    return {
      text,
      confidence: Math.round(data.confidence),
      amountGuess: guessAmountFromReceiptText(text),
      items: extractLineItemsFromReceiptText(text)
    };
  } finally {
    await worker.terminate();
  }
}
