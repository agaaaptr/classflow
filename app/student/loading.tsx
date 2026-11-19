export default function Loading() {
  return (
    <div className="space-y-section" aria-busy="true">
      <div className="space-y-2" aria-hidden>
        <div className="skeleton h-7 w-48" />
        <div className="skeleton h-4 w-80" />
      </div>

      <section className="rounded-card border border-cloud bg-white">
        <div className="border-b border-cloud px-5 py-3">
          <div className="skeleton h-4 w-28" />
        </div>
        <div className="space-y-4 p-5" aria-hidden>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-4 w-56" />
              <div className="skeleton h-8 w-24" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-cloud bg-white">
        <div className="border-b border-cloud px-5 py-3">
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="space-y-4 p-5" aria-hidden>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="skeleton h-5 w-44" />
              <div className="skeleton h-8 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
