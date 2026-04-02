import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Task, ProtocolStep } from '../types';

interface TimerContextType {
    timeLeft: number;
    isActive: boolean;
    activeTask: Task | null;
    activeStep: ProtocolStep | null;
    startTimer: (duration?: number) => void;
    pauseTimer: () => void;
    extendTimer: (seconds: number) => void;
    resetTimer: (duration: number) => void;
    setTask: (task: Task | null, stepIndex?: number) => void;
    formatTime: (seconds: number) => string;
    flashTrigger: number; // Increments on step completion to signal UI flashes
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [activeStep, setActiveStep] = useState<ProtocolStep | null>(null);
    const [flashTrigger, setFlashTrigger] = useState(0);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize Web Worker
        workerRef.current = new Worker('/timer.worker.js');
        
        workerRef.current.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'TICK') {
                setTimeLeft(payload);
            } else if (type === 'DONE') {
                setIsActive(false);
                setTimeLeft(0);
                setFlashTrigger(prev => prev + 1);
                triggerAlert();
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const triggerAlert = () => {
        // Zen Bell (Soft single strike)
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3');
        audio.play().catch(e => console.log("Audio play blocked", e));

        if (Notification.permission === 'granted') {
            new Notification("Protocol Step Complete", {
                body: activeStep ? `Completed: ${activeStep.title}` : "Focus session finished",
                icon: '/favicon.svg'
            });
        }
    };

    const startTimer = (duration?: number) => {
        if (!duration && timeLeft <= 0) return;
        setIsActive(true);
        workerRef.current?.postMessage({ type: 'START', payload: duration });
        
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    const pauseTimer = () => {
        setIsActive(false);
        workerRef.current?.postMessage({ type: 'PAUSE' });
    };

    const extendTimer = (seconds: number) => {
        workerRef.current?.postMessage({ type: 'EXTEND', payload: seconds });
    };

    const resetTimer = (duration: number) => {
        setTimeLeft(duration);
        setIsActive(false);
        workerRef.current?.postMessage({ type: 'RESET', payload: duration });
    };

    const setTask = (task: Task | null, stepIndex: number = 0) => {
        setActiveTask(task);
        if (task && task.isRitual && task.subtasksJson) {
            try {
                const steps = JSON.parse(task.subtasksJson);
                setActiveStep(steps[stepIndex] || null);
            } catch { setActiveStep(null); }
        } else {
            setActiveStep(null);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <TimerContext.Provider value={{
            timeLeft, isActive, activeTask, activeStep,
            startTimer, pauseTimer, extendTimer, resetTimer, setTask, formatTime,
            flashTrigger
        }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimerContext = () => {
    const context = useContext(TimerContext);
    if (!context) throw new Error('useTimerContext must be used within a TimerProvider');
    return context;
};
