import { useTaskContext } from '../context/TaskContext';

/**
 * useTasks Hook (Refactored to Global TaskContext)
 * Consumes the central task state from TaskProvider.
 * This ensures Habits, Dashboard, Calendar, and Focus screens are 100% in sync.
 */
export const useTasks = (userId?: string, includeDeleted?: boolean) => {
    const context = useTaskContext();
    
    return {
        ...context
    };
};
