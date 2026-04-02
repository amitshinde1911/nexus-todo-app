import React from 'react';
import { clsx } from '../lib/utils';
import { Task } from '../types';

interface RitualButtonProps {
    ritual: Task;
    onToggle: (task: Task) => void;
}

export default function RitualButton({ ritual, onToggle }: RitualButtonProps) {
    const isCompleted = ritual.completed;
    const executionTime = ritual.completedAt ? new Date(ritual.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <button
            onClick={() => onToggle(ritual)}
            className={clsx(
                "flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 group relative overflow-hidden active:scale-95",
                isCompleted 
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : "bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]"
            )}
        >
            <div className={clsx(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                isCompleted ? "bg-white/20" : "bg-[var(--bg-main)] text-[var(--text-secondary)] group-hover:text-[var(--accent)]"
            )}>
                {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                )}
            </div>
            
            <div className="flex flex-col items-start">
                <span className={clsx(
                    "text-[11px] font-black uppercase tracking-widest leading-none",
                    isCompleted ? "text-white" : "text-[var(--text-primary)]"
                )}>
                    {ritual.title}
                </span>
                {isCompleted && (
                    <span className="text-[9px] font-bold text-white/60 mt-0.5 leading-none uppercase tracking-tighter">
                        Log: {executionTime}
                    </span>
                )}
            </div>

            {/* Subtle glow for essentials */}
            {ritual.isEssential && !isCompleted && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
        </button>
    );
}
