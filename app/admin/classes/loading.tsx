export default function Loading() {
  return (
    <div className="space-y-section" aria-busy="true">
      <div className="flex items-center justify-between gap-3" aria-hidden>
        <div className="space-y-2">
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-11 w-28" />
      </div>

      <section className="rounded-card border border-cloud bg-white">
        <div className="border-b border-cloud px-5 py-3">
          <div className="skeleton h-5 w-32" />
        </div>
        <div className="divide-y divide-cloud/70">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-4 w-16" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
