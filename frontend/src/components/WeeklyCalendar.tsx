import React, { useState } from 'react';
import { clsx } from '../lib/utils';

interface WeeklyCalendarProps {
    selectedDate: string;
    onSelectDate: (date: string, dayIndex: number) => void;
}

export default function WeeklyCalendar({ selectedDate, onSelectDate }: WeeklyCalendarProps) {
    const [weekStart, setWeekStart] = useState(() => {
        const d = new Date(selectedDate || new Date());
        const day = d.getDay();
        const diff = d.getDate() - day; // Adjust to Sunday
        return new Date(d.setDate(diff));
    });

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const goNextWeek = () => {
        const next = new Date(weekStart);
        next.setDate(next.getDate() + 7);
        setWeekStart(next);
        
        const currentSel = new Date(selectedDate);
        const nextSel = new Date(next);
        nextSel.setDate(nextSel.getDate() + currentSel.getDay());
        onSelectDate(nextSel.toISOString().split('T')[0], nextSel.getDay());
    };

    const goPrevWeek = () => {
        const prev = new Date(weekStart);
        prev.setDate(prev.getDate() - 7);
        setWeekStart(prev);
        
        const currentSel = new Date(selectedDate);
        const prevSel = new Date(prev);
        prevSel.setDate(prevSel.getDate() + currentSel.getDay());
        onSelectDate(prevSel.toISOString().split('T')[0], prevSel.getDay());
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > 50) goNextWeek();
        if (distance < -50) goPrevWeek();
    };

    const getWeekRangeLabel = () => {
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 6);
        const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${startStr} – ${endStr}`;
    };

    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        days.push(
            <div 
                key={dateStr}
                onClick={() => onSelectDate(dateStr, i)}
                className={clsx(
                    "relative flex-1 flex flex-col items-center justify-center py-4 rounded-2xl cursor-pointer transition-all duration-500 overflow-hidden",
                    isSelected 
                        ? "bg-white/10 text-white scale-105 z-10 shadow-sm" 
                        : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                )}
            >
                <span className={clsx(
                    "text-[9px] font-bold uppercase tracking-[0.2em] mb-2 transition-colors duration-300",
                    isSelected ? "text-primary" : "opacity-40"
                )}>
                    {dayNamesShort[i]}
                </span>
                <span className="text-sm font-bold tracking-tight">
                    {d.getDate()}
                </span>
                
                {isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(108,92,231,0.8)]" />
                )}
                
                {isToday && !isSelected && (
                    <div className="absolute top-2 right-2 w-1 h-1 bg-white/20 rounded-full" />
                )}
            </div>
        );
    }

    return (
        <div className="mb-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={goPrevWeek} 
                        className="btn-icon w-8 h-8 !rounded-lg"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <button 
                        onClick={goNextWeek} 
                        className="btn-icon w-8 h-8 !rounded-lg"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                </div>
                
                <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em]">
                    {getWeekRangeLabel()}
                </h3>
            </div>
            
            <div 
                onTouchStart={handleTouchStart} 
                onTouchMove={handleTouchMove} 
                onTouchEnd={handleTouchEnd}
                className="relative flex gap-1 p-1 glass rounded-[24px]"
            >
                {days}
            </div>
        </div>
    );
}
