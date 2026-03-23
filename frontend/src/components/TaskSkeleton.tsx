import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
);

export const TaskSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in max-w-4xl mx-auto py-8">
    <div className="space-y-3 px-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
    </div>
    <div className="space-y-4 pt-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
    </div>
  </div>
);

export default TaskSkeleton;
