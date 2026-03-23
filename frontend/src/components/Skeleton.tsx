import React from 'react';
import { clsx } from '../lib/utils';

export function Skeleton({ className, variant = 'rect' }: { className?: string, variant?: 'rect' | 'circle' }) {
    return (
        <div 
            className={clsx(
                "bg-gray-100 animate-pulse",
                variant === 'circle' ? "rounded-full" : "rounded-lg",
                className
            )} 
        />
    );
}

export function TaskSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 card animate-pulse border-none bg-gray-50/50">
            <Skeleton className="w-5 h-5 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="w-2/3 h-4" />
                <Skeleton className="w-1/3 h-3" />
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="p-6 card space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10" variant="circle" />
                <div className="space-y-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3" />
                </div>
            </div>
            <Skeleton className="w-full h-20" />
        </div>
    );
}
