export default function InfluencerCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />

        <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />

        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-4" />

        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>
    </div>
  );
}
