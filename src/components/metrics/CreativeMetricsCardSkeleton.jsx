export default function CreativeMetricsCardSkeleton() {
  return (
    <div className="gradient-card rounded-xl border premium-shadow overflow-hidden">
      <div className="p-5">
        <div className="min-w-[1100px] grid grid-cols-[minmax(280px,auto)_minmax(400px,1fr)_minmax(220px,auto)] gap-6 items-center">

          <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex-shrink-0 w-20 aspect-[9/16] bg-surfaceMuted/40 rounded-xl overflow-hidden skeleton" />

            <div className="min-w-0 space-y-2.5">
              <div className="h-5 w-40 bg-surfaceMuted/40 rounded skeleton" />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-surfaceMuted/30 rounded skeleton" />
                  <div className="h-1 w-1 rounded-full bg-surfaceMuted/30" />
                  <div className="h-3 w-8 bg-surfaceMuted/30 rounded skeleton" />
                </div>
                <div className="h-4 w-20 bg-surfaceMuted/30 rounded skeleton" />
              </div>
            </div>
          </div>

          <div className="min-w-0 grid grid-cols-2 gap-x-6 gap-y-4 px-6 border-l border-r border-white/[0.08]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-surfaceMuted/30 rounded skeleton" />
                <div className="h-6 w-24 bg-surfaceMuted/40 rounded skeleton" />
              </div>
            ))}
          </div>

          <div className="min-w-0 flex items-center gap-6">
            <div className="space-y-3 min-w-[180px]">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-surfaceMuted/30 rounded skeleton" />
                <div className="h-9 w-36 bg-green-500/10 rounded skeleton" />
              </div>

              <div className="pt-3 border-t border-white/[0.08] space-y-2">
                <div className="h-3 w-20 bg-surfaceMuted/30 rounded skeleton" />
                <div className="h-5 w-24 bg-surfaceMuted/40 rounded skeleton" />

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-8 bg-surfaceMuted/30 rounded skeleton" />
                    <div className="h-3 w-16 bg-surfaceMuted/30 rounded skeleton" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-8 bg-surfaceMuted/30 rounded skeleton" />
                    <div className="h-3 w-16 bg-surfaceMuted/30 rounded skeleton" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 w-8 h-8 bg-surfaceMuted/30 rounded-lg skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}
