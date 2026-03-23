import React, { useState, useEffect } from 'react';

/**
 * DigitalClock component for a premium, Genz-inspired UI experience.
 * Features 12-hour IST time with seconds and AM/PM indicators.
 */
export default function DigitalClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format time for IST (Indian Standard Time)
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    };

    const timeString = time.toLocaleTimeString('en-IN', options);
    const parts = timeString.split(' ');
    const timePart = parts[0];
    const ampm = (parts[1] || '').toUpperCase();
    const [hours, minutes, seconds] = timePart.split(':');

    return (
        <div className="flex items-center gap-2 px-6 py-3 glass-card border-[var(--accent)]/10 shadow-[0_0_20px_rgba(108,92,231,0.05)] group hover:border-[var(--accent)]/30 transition-all duration-500 animate-blur-in">
            {/* Hour Sector */}
            <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter drop-shadow-sm group-hover:text-[var(--accent)] transition-colors">
                    {hours}
                </span>
                <span className="text-[7px] font-black text-[var(--text-secondary)]/20 uppercase tracking-[0.2em]">Hours</span>
            </div>

            <span className="text-xl font-bold text-[var(--accent)]/30 mb-4 scale-y-110 animate-pulse text-[12px]">:</span>

            {/* Minute Sector */}
            <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter drop-shadow-sm group-hover:text-[var(--accent)] transition-colors">
                    {minutes}
                </span>
                <span className="text-[7px] font-black text-[var(--text-secondary)]/20 uppercase tracking-[0.2em]">Minutes</span>
            </div>

            <span className="text-xl font-bold text-[var(--accent)]/30 mb-4 scale-y-110 animate-pulse text-[12px]">:</span>

            {/* Second Sector */}
            <div className="flex flex-col items-center min-w-[32px]">
                <span className="text-2xl font-black text-[var(--accent)] tracking-tighter drop-shadow-[0_0_8px_rgba(108,92,231,0.3)]">
                    {seconds}
                </span>
                <span className="text-[7px] font-black text-[var(--text-secondary)]/20 uppercase tracking-[0.2em]">Seconds</span>
            </div>

            {/* AM/PM Indicator - Only show current */}
            {ampm && (
                <div className="ml-3 px-2 py-1 bg-[var(--accent)] rounded shadow-[0_2px_8px_rgba(108,92,231,0.3)] text-white">
                    <span className="text-[8px] font-black tracking-widest">{ampm}</span>
                </div>
            )}
        </div>
    );
}
