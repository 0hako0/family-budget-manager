"use client";

import { useState } from "react";
import { formatInviteCode } from "@/lib/invite-code";

export function InviteCodeCard({ code }: { code?: string }) {
  const [copied, setCopied] = useState(false);
  const displayCode = formatInviteCode(code);

  async function copyCode() {
    if (!displayCode) return;
    await navigator.clipboard.writeText(displayCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-ink">
      <p>家計コード</p>
      <p className="mt-1 text-3xl font-black tracking-widest text-leaf">{displayCode || "未発行"}</p>
      <button
        className="mt-3 min-h-11 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-leaf shadow-sm transition active:scale-[0.98] disabled:opacity-50"
        type="button"
        onClick={copyCode}
        disabled={!displayCode}
      >
        {copied ? "コピーしました" : "コピー"}
      </button>
    </div>
  );
}
