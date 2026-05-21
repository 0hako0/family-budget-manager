import type { ReactNode } from "react";

type ListSectionProps = {
  title: string;
  children: ReactNode;
};

export function ListSection({ title, children }: ListSectionProps) {
  return (
    <section className="rounded-lg border border-emerald-900/10 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold tracking-normal text-ink">{title}</h2>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table className="hidden min-w-full border-separate border-spacing-y-2 text-left text-sm sm:table">
      <thead className="text-xs text-ink/50">
        <tr>
          {headers.map((header) => (
            <th key={header} className="whitespace-nowrap px-3 py-1 font-semibold">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function Td({ children }: { children: ReactNode }) {
  return <td className="whitespace-nowrap bg-cream/55 px-3 py-3 first:rounded-l-lg last:rounded-r-lg">{children}</td>;
}
