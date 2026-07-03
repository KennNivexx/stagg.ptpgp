export default function EProcurementLoading() {
  return (
    <main className="min-h-screen bg-[#F9F7F6] pt-[72px]">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-12 animate-pulse">
            <div className="flex-1 space-y-4 w-full">
              <div className="h-5 w-40 rounded-sm bg-slate-200" />
              <div className="h-10 w-full max-w-md rounded bg-slate-200" />
              <div className="h-3 w-full max-w-lg rounded bg-slate-100" />
              <div className="h-3 w-2/3 max-w-md rounded bg-slate-100" />
              <div className="flex gap-4 pt-2">
                <div className="h-12 w-40 rounded-sm bg-slate-200" />
                <div className="h-12 w-36 rounded-sm bg-slate-100" />
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-[4/3] rounded-md bg-slate-200 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 w-16 rounded bg-slate-700 mx-auto" />
                <div className="h-2.5 w-24 rounded bg-slate-700 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 space-y-3 animate-pulse">
          <div className="h-7 w-64 rounded bg-slate-200 mx-auto" />
          <div className="h-3 w-96 max-w-full rounded bg-slate-100 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-8 rounded-md border border-gray-100 shadow-sm flex gap-5 animate-pulse">
              <div className="h-12 w-12 rounded-sm bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 rounded bg-slate-200" />
                <div className="h-2.5 w-full rounded bg-slate-100" />
                <div className="h-2.5 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
