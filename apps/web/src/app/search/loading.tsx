export default function SearchLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-xl p-4 flex items-center gap-4 animate-pulse">
          <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
