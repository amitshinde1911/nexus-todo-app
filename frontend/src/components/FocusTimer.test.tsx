import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FocusTimer from './FocusTimer';
import React from 'react';

// Mocking lib utils
vi.mock('../lib/utils', () => ({
    clsx: (...args: any[]) => args.filter(Boolean).join(' ')
}));

describe('FocusTimer', () => {
    const mockSetTab = vi.fn();
    const mockTask = {
        id: '1',
        userId: 'user1',
        title: 'Test Task',
        priority: 'HIGH' as const,
        status: 'TODO' as const,
        completed: false,
        deleted: false,
        category: 'Work' as const,
        dueDate: '2024-01-01',
        dueTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        estimatedMins: 25,
        actualMins: 0,
        repeat: 'NONE' as const,
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders correctly with an active task', () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Top Priority')).toBeInTheDocument();
        expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('toggles timer when start button is clicked', () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        
        const toggleButton = screen.getByTestId('timer-toggle');
        fireEvent.click(toggleButton);
        expect(screen.getByText('Execution Active')).toBeInTheDocument();
    });

    it('counts down when active', async () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        const toggleButton = screen.getByTestId('timer-toggle');
        
        fireEvent.click(toggleButton);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText('24:59')).toBeInTheDocument();
    });

    it('resets when reset button is clicked', () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        const toggleButton = screen.getByTestId('timer-toggle');
        const resetButton = screen.getByTestId('timer-reset');
        
        fireEvent.click(toggleButton);

        act(() => {
            vi.advanceTimersByTime(10000);
        });

        expect(screen.getByText('24:50')).toBeInTheDocument();

        fireEvent.click(resetButton);
        expect(screen.getByText('25:00')).toBeInTheDocument();
        expect(screen.getByText('Standby Mode')).toBeInTheDocument();
    });

    it('switches tabs when clicking "Switch Focus"', () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        fireEvent.click(screen.getByText('Switch Focus'));
        expect(mockSetTab).toHaveBeenCalledWith('TODAY');
    });
});
