'use client'
export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-6 shadow-xl space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
        </div>
        <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
      </div>
      <div>
        <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded-md mb-2"></div>
        <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded-md"></div>
        <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded-md"></div>
      </div>
      <div className="h-2 w-full bg-gray-300 dark:bg-gray-700 rounded-full mt-3"></div>
    </div>
  );
}
