"use client";

export type CompressedReceiptImage = {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
};

export async function compressReceiptImage(file: File, maxLongEdge = 1280, quality = 0.75): Promise<CompressedReceiptImage> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(imageUrl);
    const scale = Math.min(1, maxLongEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を圧縮できませんでした。");
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("画像を圧縮できませんでした。"))), "image/jpeg", quality);
    });
    return { blob, previewUrl: URL.createObjectURL(blob), width, height, size: blob.size };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    image.src = url;
  });
}
