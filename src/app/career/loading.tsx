export default function CareerLoading() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] pt-[72px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-3 w-32 rounded-full bg-slate-200 mx-auto" />
          <div className="h-9 w-2/3 max-w-xl rounded bg-slate-200 mx-auto" />
          <div className="h-3 w-1/2 max-w-md rounded bg-slate-100 mx-auto" />
        </div>

        {/* Stats banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-slate-100 rounded-2xl p-8 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 w-16 rounded bg-slate-200 mx-auto" />
              <div className="h-2.5 w-20 rounded bg-slate-200 mx-auto" />
            </div>
          ))}
        </div>

        {/* Job list */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 animate-pulse">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-200" />
                  <div className="h-2.5 w-32 rounded bg-slate-100" />
                </div>
                <div className="h-9 w-28 rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
