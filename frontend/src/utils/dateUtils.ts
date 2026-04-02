/**
 * Nexus Date Utilities
 * Lightweight, zero-dependency engine for calendar grids and formatting.
 */

export const getMonthGrid = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for 1st of month (0=Sun, 1=Mon, ..., 6=Sat)
    let startDay = firstDay.getDay(); 
    // Adjust to Monday start if preferred, but image shows Sunday start (Su Mo Tu We Th Fr Sa)
    // Looking at the image: Su Mo Tu We Th Fr Sa. Sun is the 1st col.
    
    const daysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const grid = [];
    
    // Previous month's trailing days
    for (let i = startDay - 1; i >= 0; i--) {
        grid.push({
            day: prevMonthLastDay - i,
            month: month - 1,
            year,
            isCurrentMonth: false
        });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push({
            day: i,
            month,
            year,
            isCurrentMonth: true
        });
    }
    
    // Next month's leading days to fill 6 weeks (42 cells)
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
        grid.push({
            day: i,
            month: month + 1,
            year,
            isCurrentMonth: false
        });
    }
    
    return grid;
};

export const formatMonthHeader = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
};

export const getIsoDateStr = (year: number, month: number, day: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
};
