import { useState, useEffect } from 'react';

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
        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg transition-all duration-300">
            {/* Hour Sector */}
            <div className="flex flex-col items-center">
                <span className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                    {hours}
                </span>
                <span className="text-[8px] font-medium text-[var(--text-secondary)]/40">Hours</span>
            </div>

            <span className="text-sm font-medium text-[var(--text-secondary)]/20 mb-4">:</span>

            {/* Minute Sector */}
            <div className="flex flex-col items-center">
                <span className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                    {minutes}
                </span>
                <span className="text-[8px] font-medium text-[var(--text-secondary)]/40">Minutes</span>
            </div>

            <span className="text-sm font-medium text-[var(--text-secondary)]/20 mb-4">:</span>

            {/* Second Sector */}
            <div className="flex flex-col items-center min-w-[28px]">
                <span className="text-xl font-semibold text-[var(--accent)] tracking-tight">
                    {seconds}
                </span>
                <span className="text-[8px] font-medium text-[var(--text-secondary)]/40">Seconds</span>
            </div>

            {/* AM/PM Indicator */}
            {ampm && (
                <div className="ml-2 px-1.5 py-0.5 bg-[var(--accent)] rounded text-white">
                    <span className="text-[9px] font-semibold tracking-tight">{ampm}</span>
                </div>
            )}
        </div>
    );
}
