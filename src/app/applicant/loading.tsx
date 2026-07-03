export default function ApplicantDashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-6 w-56 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-96 max-w-full rounded bg-slate-100" />
      </div>

      {/* Status banner */}
      <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-32 rounded bg-slate-200" />
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-3 w-64 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-slate-200 mb-3" />
            <div className="h-3 w-32 rounded bg-slate-200 mb-2" />
            <div className="h-2.5 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
