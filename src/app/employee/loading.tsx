export default function EmployeeDashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero banner */}
      <div className="rounded-3xl p-6 lg:p-8 bg-slate-100 animate-pulse">
        <div className="h-3 w-24 rounded-full bg-slate-200 mb-4" />
        <div className="h-7 w-64 rounded bg-slate-200 mb-3" />
        <div className="h-3 w-80 rounded bg-slate-200 mb-6" />
        <div className="flex gap-4 pt-4 border-t border-slate-200">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="h-3 w-32 rounded bg-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-200 shrink-0" />
              <div className="space-y-2">
                <div className="h-3 w-40 rounded bg-slate-200" />
                <div className="h-2.5 w-32 rounded bg-slate-100" />
                <div className="h-6 w-28 rounded-lg bg-slate-100" />
              </div>
            </div>
            <div className="h-11 w-36 rounded-2xl bg-slate-200 shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-slate-200 mb-3" />
                <div className="h-3 w-32 rounded bg-slate-200 mb-2" />
                <div className="h-2.5 w-full rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
              <div className="h-3 w-28 rounded bg-slate-200 mb-3" />
              <div className="h-2 w-full rounded-full bg-slate-100 mb-2" />
              <div className="h-2.5 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
