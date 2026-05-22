export default function MobileLoading() {
  return (
    <div className="grid gap-5" aria-label="読み込み中">
      <section className="rounded-[22px] border border-leaf/10 bg-white p-5 shadow-soft">
        <div className="h-4 w-36 animate-pulse rounded-full bg-emerald-100" />
        <div className="mt-5 h-12 w-40 animate-pulse rounded-2xl bg-cream" />
        <div className="mt-6 grid gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-emerald-50" />
          <div className="h-20 animate-pulse rounded-2xl bg-cream/80" />
        </div>
      </section>
      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="h-5 w-28 animate-pulse rounded-full bg-cream" />
        <div className="mt-4 grid gap-2">
          <div className="h-12 animate-pulse rounded-2xl bg-cream/80" />
          <div className="h-12 animate-pulse rounded-2xl bg-cream/70" />
        </div>
      </section>
    </div>
  );
}
