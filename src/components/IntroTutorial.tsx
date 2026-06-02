"use client";

import { useEffect, useState } from "react";

const storageKey = "family-budget:intro-tutorial-dismissed";

const steps = ["家計グループを作成", "家計コードをパートナーに共有", "支出を登録", "共通クレカを設定", "貯金目標を設定"];

export function IntroTutorial() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(storageKey) !== "true");
  }, []);

  if (!visible) return null;

  return (
    <section className="rounded-[22px] border border-leaf/20 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-leaf">はじめに</p>
          <h2 className="mt-1 text-lg font-black text-ink">実運用までの5ステップ</h2>
        </div>
        <button
          type="button"
          className="min-h-10 rounded-full bg-white px-3 text-xs font-black text-ink/60 transition active:scale-[0.98]"
          onClick={() => {
            window.localStorage.setItem(storageKey, "true");
            setVisible(false);
          }}
        >
          閉じる
        </button>
      </div>
      <ol className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-ink">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf text-xs text-white">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
