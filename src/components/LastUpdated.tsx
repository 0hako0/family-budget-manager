"use client";

import { useEffect, useState } from "react";

const refreshEventName = "family-budget-refreshed";

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }).format(date);
}

export function LastUpdated() {
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    const initial = window.localStorage.getItem("family-budget:last-refresh") ?? new Date().toISOString();
    window.localStorage.setItem("family-budget:last-refresh", initial);
    setLastUpdated(formatTime(initial));

    function update() {
      setLastUpdated(formatTime(window.localStorage.getItem("family-budget:last-refresh") ?? new Date().toISOString()));
    }

    window.addEventListener(refreshEventName, update);
    return () => window.removeEventListener(refreshEventName, update);
  }, []);

  return <p className="text-[11px] font-bold text-ink/45">最終更新 {lastUpdated || "--:--"}</p>;
}
