import { useState, useEffect } from 'react';

export default function CompactClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 60000); // 1-minute update is enough for compact
        return () => clearInterval(timer);
    }, []);

    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };

    return (
        <div className="flex items-center gap-2 group cursor-default">
            <svg className="text-[var(--text-secondary)] opacity-40 group-hover:opacity-100 transition-opacity" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-[13px] font-bold tabular-nums tracking-tighter text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {time.toLocaleTimeString('en-US', options)}
            </span>
        </div>
    );
}
