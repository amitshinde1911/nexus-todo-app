import { useState, useEffect } from 'react';
import { Task } from '../types';

export const useTimer = (activeTask: Task | null) => {
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    useEffect(() => {
        if (!activeTask || !activeTask.startTime || activeTask.status !== 'IN_PROGRESS') {
            setSecondsElapsed(0);
            return;
        }

        const calculateElapsed = () => {
            const start = new Date(activeTask.startTime!).getTime();
            const now = new Date().getTime();
            return Math.floor((now - start) / 1000);
        };

        // Initial calculation
        setSecondsElapsed(calculateElapsed());

        // Update every second
        const interval = setInterval(() => {
            setSecondsElapsed(calculateElapsed());
        }, 1000);

        return () => clearInterval(interval);
    }, [activeTask?.startTime, activeTask?.status]);

    return { secondsElapsed };
};
