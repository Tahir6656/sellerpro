interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
