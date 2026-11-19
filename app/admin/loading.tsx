export default function Loading() {
  return (
    <div className="space-y-section" aria-busy="true">
      <div className="space-y-2" aria-hidden>
        <div className="skeleton h-7 w-56" />
        <div className="skeleton h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-cloud bg-white px-4 py-3">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton mt-2 h-6 w-16" />
          </div>
        ))}
      </div>

      {Array.from({ length: 4 }).map((_, i) => (
        <section key={i} className="rounded-card border border-cloud bg-white">
          <div className="border-b border-cloud px-5 py-3">
            <div className="skeleton h-4 w-40" />
          </div>
          <div className="space-y-3 p-5" aria-hidden>
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="skeleton h-5 w-32" />
                  <div className="skeleton h-4 w-48" />
                </div>
                <div className="skeleton h-8 w-24" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
