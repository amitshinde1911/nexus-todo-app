import React from 'react';
import { clsx } from '../lib/utils';

interface CircularMetricProps {
    value: number; // 0-100
    label: string;
    sublabel?: string;
    size?: number;
    strokeWidth?: number;
    color?: string;
}

export default function CircularMetric({ 
    value, label, sublabel, size = 120, strokeWidth = 8, color = "var(--accent)" 
}: CircularMetricProps) {
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-4 group">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="rotate-[-90deg]">
                    {/* Background Ring */}
                    <circle
                        cx={center} cy={center} r={radius}
                        fill="transparent"
                        stroke="currentColor" strokeWidth={strokeWidth}
                        className="text-[var(--border)] opacity-20"
                    />
                    {/* Progress Ring */}
                    <circle
                        cx={center} cy={center} r={radius}
                        fill="transparent"
                        stroke={color} strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums leading-none">
                        {value}%
                    </span>
                    {sublabel && (
                        <span className="text-[9px] font-bold uppercase tracking-tight text-[var(--text-secondary)] mt-1 opacity-60">
                            {sublabel}
                        </span>
                    )}
                </div>
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {label}
            </span>
        </div>
    );
}
