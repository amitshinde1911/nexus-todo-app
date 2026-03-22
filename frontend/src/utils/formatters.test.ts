import { describe, it, expect } from 'vitest';
import { formatDate, formatTime } from './formatters';

describe('formatters', () => {
    describe('formatDate', () => {
        it('formats a date string correctly', () => {
            const dateStr = '2023-10-27';
            const formatted = formatDate(dateStr);
            expect(formatted).toContain('Friday');
            expect(formatted).toContain('Oct 27');
        });
    });

    describe('formatTime', () => {
        it('returns "N/A" if time string is null', () => {
            expect(formatTime(null)).toBe('N/A');
        });

        it('returns the time string if provided', () => {
            expect(formatTime('14:30')).toBe('14:30');
        });
    });
});
