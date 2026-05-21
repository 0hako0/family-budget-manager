export function yen(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

export function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
