export default function Loading() {
  return (
    <div className="space-y-section" aria-busy="true">
      <div className="space-y-2" aria-hidden>
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-4 w-72" />
      </div>

      <div className="grid gap-section lg:grid-cols-[1fr_360px]">
        <section className="rounded-card border border-cloud bg-white">
          <div className="border-b border-cloud px-5 py-3">
            <div className="skeleton h-4 w-32" />
          </div>
          <div className="space-y-4 p-5" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-4 w-64" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-cloud bg-white">
          <div className="space-y-4 p-5" aria-hidden>
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-11 w-full" />
          </div>
        </section>
      </div>
    </div>
  );
}
