export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="h-12 w-64 bg-slate-200 rounded animate-pulse" />
          
          {/* Task skeletons */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-white rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
