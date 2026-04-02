import React, { useState, useEffect } from 'react';
import { clsx } from '../lib/utils';
import { Task } from '../types';
import { useTimerContext } from '../context/TimerContext';

interface FocusTimerProps {
    focusTask: Task | null;
    setTab: (tab: string) => void;
    onUpdateTask?: (id: string, updates: Partial<Task>) => Promise<void>;
    onStartTask?: (id: string) => Promise<void>;
    onPauseTask?: (id: string) => Promise<void>;
    onStopTask?: (id: string) => Promise<void>;
}

export default function FocusTimer({ focusTask, setTab, onUpdateTask, onStartTask, onPauseTask, onStopTask }: FocusTimerProps) {
    const { 
        timeLeft, isActive, activeTask, activeStep, 
        startTimer, pauseTimer, extendTimer, resetTimer, setTask, formatTime 
    } = useTimerContext();

    const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);
    const [loadedStepId, setLoadedStepId] = useState<string | null>(null);
    const [showReward, setShowReward] = useState(false);

    // Ritual Parsing
    const ritualSteps = React.useMemo(() => {
        if (!focusTask || !focusTask.isRitual) return [];
        try { return JSON.parse(focusTask.subtasksJson || '[]'); } 
        catch (e) { return []; }
    }, [focusTask]);

    const activeStepIndex = ritualSteps.findIndex((s: any) => s.status === 'pending');
    
    useEffect(() => {
        if (focusTask && (loadedTaskId !== focusTask.id || (focusTask.isRitual && loadedStepId !== activeStep?.id))) {
            setTask(focusTask, activeStepIndex >= 0 ? activeStepIndex : 0);
            
            let optimalMins = 25;
            if (focusTask.isRitual && activeStep && activeStep.duration) {
                optimalMins = activeStep.duration;
            } else if (!focusTask.isRitual) {
                if (focusTask.priority === 'URGENT') optimalMins = 50;
                else if (focusTask.priority === 'HIGH') optimalMins = 45;
                else if (focusTask.priority === 'MEDIUM') optimalMins = 30;
                else if (focusTask.priority === 'LOW') optimalMins = 20;
            }
            
            resetTimer(optimalMins * 60);
            setLoadedTaskId(focusTask.id);
            setLoadedStepId(activeStep?.id || null);
        }
    }, [focusTask, activeStepIndex, loadedTaskId, loadedStepId, activeStep?.id]);

    const toggleTimer = async () => {
        if (isActive) {
            pauseTimer();
            if (focusTask && !focusTask.isRitual) await onPauseTask?.(focusTask.id);
        } else {
            startTimer();
            if (focusTask && !focusTask.isRitual) await onStartTask?.(focusTask.id);
        }
    };

    const handleCompleteTask = async () => {
        if (!focusTask) return;
        pauseTimer();

        if (focusTask.isRitual && activeStep && onUpdateTask) {
            const updatedSteps = ritualSteps.map((s: any) => 
                s.id === activeStep.id ? { ...s, status: 'completed', completedAt: new Date().toISOString() } : s
            );
            
            const isLastStep = updatedSteps.every((s: any) => s.status === 'completed' || s.status === 'deferred');
            
            if (isLastStep) {
                setShowReward(true);
                await onUpdateTask(focusTask.id, { subtasksJson: JSON.stringify(updatedSteps) });
                if (onStopTask) await onStopTask(focusTask.id);
            } else {
                await onUpdateTask(focusTask.id, { subtasksJson: JSON.stringify(updatedSteps) });
                startTimer(); // Auto-start the next step
            }
        } else {
            if (onStopTask) await onStopTask(focusTask.id);
        }
    };
    
    const handleSkipStep = async () => {
        if (!focusTask || !focusTask.isRitual || !activeStep || !onUpdateTask) return;
        const now = new Date().toISOString();
        const updatedSteps = ritualSteps.map((s: any) => 
            s.id === activeStep.id ? { ...s, status: 'completed', completedAt: now } : s
        );
        await onUpdateTask(focusTask.id, { subtasksJson: JSON.stringify(updatedSteps) });
        
        if (updatedSteps.every((s: any) => s.status === 'completed' || s.status === 'deferred')) {
            setShowReward(true);
            if (onStopTask) await onStopTask(focusTask.id);
        } else {
            startTimer(); 
        }
    };

    const handleDeferStep = async () => {
        if (!focusTask || !focusTask.isRitual || !activeStep || !onUpdateTask) return;
        const now = new Date().toISOString();
        const updatedSteps = ritualSteps.map((s: any) => 
            s.id === activeStep.id ? { ...s, status: 'deferred', deferredAt: now } : s
        );
        await onUpdateTask(focusTask.id, { subtasksJson: JSON.stringify(updatedSteps) });
        
        if (updatedSteps.every((s: any) => s.status === 'completed' || s.status === 'deferred')) {
            setShowReward(true);
            if (onStopTask) await onStopTask(focusTask.id);
        } else {
            startTimer();
        }
    };

    if (showReward) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in relative z-20">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mb-2">Protocol Completed!</h2>
                <p className="text-[var(--text-secondary)] font-medium mb-8">You successfully executed all steps of your routine.</p>
                <button 
                    onClick={() => { setShowReward(false); setTab && setTab('TODAY'); }}
                    className="btn-primary flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all transform hover:scale-105"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const totalDuration = activeStep?.duration ? activeStep.duration * 60 : 25 * 60;
    const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
    const isDone = timeLeft === 0;

    // SVG ring constants
    const size = 300;
    const strokeWidth = 8;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in relative">
            
            {/* NO-NONSENSE CENTRAL PROMINENCE */}
            <div className="relative z-10 text-center mb-12 px-6 w-full max-w-sm">
                {activeTask ? (
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[var(--accent-soft)] rounded-full">
                                <div className={clsx("w-1.5 h-1.5 rounded-full", isDone ? "bg-emerald-500" : "bg-[var(--accent)]", isActive && "animate-pulse")} />
                            <span className={clsx("text-[10px] font-bold uppercase tracking-widest", isDone ? "text-emerald-500" : "text-[var(--accent)]")}>
                                {activeStep ? `Step ${activeStepIndex + 1} / ${ritualSteps.length}` : "Deep Work"}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                            {activeStep?.title || activeTask.title}
                        </h2>
                    </div>
                ) : (
                    <p className="text-sm text-[var(--text-secondary)]">Standby. Awaiting objective.</p>
                )}
            </div>

            {/* CHRONOMETER RING */}
            <div className="relative z-10 w-[300px] h-[300px] mb-12 flex items-center justify-center group flex-shrink-0">
                <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                    <circle cx={center} cy={center} r={radius} fill="transparent" className="stroke-[var(--border)] opacity-30" strokeWidth={strokeWidth} />
                    <circle
                        cx={center} cy={center} r={radius} fill="transparent"
                        stroke={isDone ? "#10b981" : "var(--accent)"} strokeWidth={strokeWidth}
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round" className="transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(235,87,87,0.3)]"
                    />
                </svg>

                {/* Adjustments: Hidden by default, reveal on hover or mobile touch */}
                <button 
                    onClick={() => extendTimer(-60)}
                    className="absolute left-4 w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"
                >
                    -1m
                </button>
                <button 
                    onClick={() => extendTimer(300)}
                    className="absolute right-4 w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"
                >
                    +5m
                </button>

                <div className="relative text-center">
                    <div className={clsx(
                        "text-7xl font-bold tabular-nums tracking-tighter leading-none mb-1 transition-colors",
                        isDone ? "text-emerald-500 scale-110" : "text-[var(--text-primary)]"
                    )}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* CORE CONTROLS */}
            <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xs">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => resetTimer(totalDuration)}
                        className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)] transition-all"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>

                    <button
                        onClick={toggleTimer}
                        className={clsx(
                            "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 shadow-xl",
                            isActive 
                                ? "bg-[var(--hover)] text-[var(--text-primary)]" 
                                : isDone ? "bg-emerald-500 text-white animate-pulse" : "bg-[var(--accent)] text-white"
                        )}
                    >
                        {isActive ? (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                        ) : (
                            <svg className="ml-1" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                        )}
                    </button>

                    {activeStep ? (
                        <button
                            onClick={handleDeferStep}
                            className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-50 transition-all"
                            title="Defer to later"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </button>
                    ) : (
                        <div className="w-12 h-12" /> // Spacer
                    )}
                </div>

                <div className="w-full h-px bg-[var(--border)] opacity-40 shrink-0" />

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={handleCompleteTask}
                        className={clsx(
                            "w-full h-12 rounded-xl font-bold text-sm transition-all shadow-sm",
                            isDone ? "bg-emerald-500 text-white" : "bg-[var(--text-primary)] text-[var(--bg-main)]"
                        )}
                    >
                        {activeStep ? "Finish Step" : "Complete Mission"}
                    </button>
                    
                    {activeStep && (
                        <div className="text-center px-2">
                            {activeStepIndex < ritualSteps.length - 1 ? (
                                <p className="text-[10px] text-[var(--text-secondary)] opacity-60 font-medium">
                                    Next: {ritualSteps[activeStepIndex + 1].title}
                                </p>
                            ) : (
                                <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-wider">
                                    Final Step
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
