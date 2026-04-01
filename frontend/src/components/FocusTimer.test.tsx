import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FocusTimer from './FocusTimer';

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
        isRitual: true,
        subtasksJson: JSON.stringify([
            { id: 's1', title: 'Step 1', duration: 45, completed: false }
        ])
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders correctly with an active task', () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText(/Step 1 of 1 • Morning Ritual/i)).toBeInTheDocument();
        expect(screen.getByText('45:00')).toBeInTheDocument();
    });

    it('toggles timer when start button is clicked', () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        
        const toggleButton = screen.getByTestId('timer-toggle');
        fireEvent.click(toggleButton);
        expect(screen.getByText('Timer running')).toBeInTheDocument();
    });

    it('counts down when active', async () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        const toggleButton = screen.getByTestId('timer-toggle');
        
        fireEvent.click(toggleButton);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText('44:59')).toBeInTheDocument();
    });

    it('resets when reset button is clicked', () => {
        render(<FocusTimer focusTask={mockTask} setTab={mockSetTab} />);
        const toggleButton = screen.getByTestId('timer-toggle');
        const resetButton = screen.getByTestId('timer-reset');
        
        fireEvent.click(toggleButton);

        act(() => {
            vi.advanceTimersByTime(10000);
        });

        expect(screen.getByText('44:50')).toBeInTheDocument();

        fireEvent.click(resetButton);
        expect(screen.getByText('45:00')).toBeInTheDocument();
        expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('switches tabs when clicking "Change task"', () => {
        const nonRitualTask = { ...mockTask, isRitual: false };
        render(<FocusTimer focusTask={nonRitualTask} setTab={mockSetTab} />);
        fireEvent.click(screen.getByText('Change task'));
        expect(mockSetTab).toHaveBeenCalledWith('TODAY');
    });
});
