import React from 'react';
import { clsx } from '../lib/utils';

export function Skeleton({ className, variant = 'rect' }) {
    return (
        <div 
            className={clsx(
                "bg-secondary/40 animate-pulse",
                variant === 'circle' ? "rounded-full" : "rounded-xl",
                className
            )} 
        />
    );
}

export function TaskSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-card/40 border border-border/30 rounded-2xl animate-pulse">
            <Skeleton className="w-6 h-6 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="w-2/3 h-4" />
                <Skeleton className="w-1/3 h-3" />
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="p-6 bg-card/40 border border-border/30 rounded-2xl space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10" variant="circle" />
                <div className="space-y-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3" />
                </div>
            </div>
            <Skeleton className="w-full h-24" />
        </div>
    );
}
