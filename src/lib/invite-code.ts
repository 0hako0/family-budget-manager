export function normalizeInviteCode(code: string) {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function formatInviteCode(code?: string) {
  const normalized = normalizeInviteCode(code ?? "");
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
}
