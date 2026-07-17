import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Inbox } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

/** Shared read display for Career Development master-data config tables —
 * these are seeded defaults (career_frameworks, promotion_policies, etc.)
 * edited rarely; a real, populated table beats an empty placeholder while
 * keeping every one of these pages to a few lines. */
export default function MasterDataTable({
  title, description, backHref, rows, columns, emptyLabel, extra, bare = false,
}: {
  title: string; description: string; backHref: string;
  rows: Record<string, unknown>[]; columns: Column[]; emptyLabel: string;
  /** Extra content (e.g. summary cards) rendered between the header and the
      table. */
  extra?: React.ReactNode;
  /** Skip the page-level wrapper/header — use when embedding this table
      inside a page that already provides its own layout shell. */
  bare?: boolean;
}) {
  const table = (
    <>
      {!bare && (
        <div>
          <Link href={backHref} className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-pgp-red mb-2">
            <ChevronLeft size={14} /> Kembali
          </Link>
          <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      )}
      {extra}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={emptyLabel} className="border-none py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {columns.map((c) => (
                    <th key={c.key} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={(row.id as string) || i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-slate-700 font-medium">
                        {c.render ? c.render(row) : String(row[c.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  if (bare) return table;
  return <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">{table}</div>;
}
