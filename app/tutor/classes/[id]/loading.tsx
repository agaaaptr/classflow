export default function Loading() {
  return (
    <div className="space-y-section" aria-busy="true">
      <div className="space-y-2" aria-hidden>
        <div className="skeleton h-7 w-56" />
        <div className="skeleton h-4 w-72" />
      </div>

      <section className="rounded-card border border-cloud bg-white">
        <div className="border-b border-cloud px-5 py-3">
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="space-y-4 p-5" aria-hidden>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-11 w-full" />
            ))}
          </div>
          <div className="skeleton h-8 w-28" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-5 w-full" />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-card border border-cloud bg-white">
        <div className="border-b border-cloud px-5 py-3">
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="space-y-3 p-5" aria-hidden>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
