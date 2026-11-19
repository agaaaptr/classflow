export default function Loading() {
  return (
    <div className="space-y-section" aria-busy="true">
      <div className="space-y-2" aria-hidden>
        <div className="skeleton h-7 w-28" />
        <div className="skeleton h-4 w-72" />
      </div>
      <section className="rounded-card border border-cloud bg-white">
        <div className="border-b border-cloud px-5 py-3">
          <div className="skeleton h-5 w-32" />
        </div>
        <div className="divide-y divide-cloud/70">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="space-y-1.5">
                <div className="skeleton h-5 w-36" />
                <div className="skeleton h-4 w-56" />
              </div>
              <div className="skeleton h-6 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
