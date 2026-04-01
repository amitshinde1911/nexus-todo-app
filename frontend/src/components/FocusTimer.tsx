import React, { useState, useEffect } from 'react';
import { clsx } from '../lib/utils';
import { Task } from '../types';
import { useTimer } from '../hooks/useTimer';

interface FocusTimerProps {
    focusTask: Task | null;
    setTab: (tab: string) => void;
    onUpdateTask?: (id: string, updates: Partial<Task>) => Promise<void>;
    onStartTask?: (id: string) => Promise<void>;
    onPauseTask?: (id: string) => Promise<void>;
    onStopTask?: (id: string) => Promise<void>;
}

export default function FocusTimer({ focusTask, setTab, onUpdateTask, onStartTask, onPauseTask, onStopTask }: FocusTimerProps) {
    const { secondsElapsed } = useTimer(focusTask);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [durationMins, setDurationMins] = useState(25);
    const [totalDuration, setTotalDuration] = useState(25 * 60);
    const [ambientSound, setAmbientSound] = useState('none');
    const [distractions, setDistractions] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);
    const [showReward, setShowReward] = useState(false);

    const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);
    const [loadedStepId, setLoadedStepId] = useState<string | null>(null);

    // Ritual Parsing
    const ritualSteps = React.useMemo(() => {
        if (!focusTask || !focusTask.isRitual) return [];
        try { return JSON.parse(focusTask.subtasksJson || '[]'); } 
        catch (e) { return []; }
    }, [focusTask]);

    const activeStepIndex = ritualSteps.findIndex((s: any) => !s.completed);
    const activeStep = activeStepIndex >= 0 ? ritualSteps[activeStepIndex] : null;

    // Derive active task display
    const activeTaskTitle = focusTask 
        ? (focusTask.isRitual && activeStep ? activeStep.title : focusTask.title) 
        : null;
        
    const activeTaskSource = focusTask 
        ? (focusTask.isRitual && activeStep ? `Step ${activeStepIndex + 1} of ${ritualSteps.length} • Morning Ritual` : (focusTask.priority === 'URGENT' || focusTask.priority === 'HIGH' ? "High Priority" : "Active Task")) 
        : null;

    const estimatedSessions = focusTask
        ? Math.max(1, Math.ceil((focusTask.estimatedMins || 25) / durationMins))
        : null;
    const sessionLabel = estimatedSessions
        ? `${Math.min(sessionCount + 1, estimatedSessions)} / ${estimatedSessions}`
        : null;

    useEffect(() => {
        // Smart Timer / Focus Flow Dynamics
        if (!focusTask) return;
        
        const isNewTask = loadedTaskId !== focusTask.id;
        const isNewStep = focusTask.isRitual && loadedStepId !== activeStep?.id;

        if (isNewTask || isNewStep) {
            let optimalMins = 25;
            if (focusTask.isRitual && activeStep && activeStep.duration) {
                optimalMins = activeStep.duration;
            } else if (!focusTask.isRitual) {
                if (focusTask.priority === 'URGENT') optimalMins = 50;
                else if (focusTask.priority === 'HIGH') optimalMins = 45;
                else if (focusTask.priority === 'MEDIUM') optimalMins = 30;
                else if (focusTask.priority === 'LOW') optimalMins = 20;
            }

            setDurationMins(optimalMins);
            setTimeLeft(optimalMins * 60);
            setTotalDuration(optimalMins * 60);
            setLoadedTaskId(focusTask.id);
            setLoadedStepId(focusTask.isRitual ? activeStep?.id : null);
        }
    }, [focusTask, activeStep, loadedTaskId, loadedStepId]);

    useEffect(() => {
        if (focusTask?.status === 'IN_PROGRESS' && focusTask.startTime && !focusTask.isRitual) {
            const remaining = (durationMins * 60) - secondsElapsed;
            setTimeLeft(Math.max(0, remaining));
            setIsActive(remaining > 0);
        }
    }, [secondsElapsed, focusTask?.status, durationMins, focusTask?.isRitual]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        
        // Use local interval for rituals, OR if no global start time
        const useLocalTimer = !focusTask?.startTime || focusTask?.isRitual;

        if (useLocalTimer && isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            setSessionCount(s => s + 1);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
            
            // Auto complete step logic if timer rings on ritual
            if (focusTask?.isRitual && activeStep) {
                 handleCompleteTask(); // Auto move to next step when timer is up
            }
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft, focusTask?.startTime, focusTask?.isRitual]);

    const setPreset = (mins: number) => {
        setIsActive(false);
        setDurationMins(mins);
        setTimeLeft(mins * 60);
        setTotalDuration(mins * 60);
    };

    const toggleTimer = async () => {
        if (focusTask && !focusTask.isRitual) {
            if (focusTask.status === 'IN_PROGRESS') {
                await onPauseTask?.(focusTask.id);
            } else {
                await onStartTask?.(focusTask.id);
            }
        } else {
            // For rituals, we handle start/stop completely locally to avoid global sync issues per step
            setIsActive(!isActive);
        }
    };

    const handleLogDistraction = () => setDistractions(prev => prev + 1);

    const handleCompleteTask = async () => {
        if (!focusTask) return;
        setIsActive(false);

        if (focusTask.isRitual && activeStep && onUpdateTask) {
            const updatedSteps = ritualSteps.map((s: any) => 
                s.id === activeStep.id ? { ...s, completed: true } : s
            );
            
            const isLastStep = updatedSteps.every((s: any) => s.completed);
            
            if (isLastStep) {
                setShowReward(true);
                await onUpdateTask(focusTask.id, { subtasksJson: JSON.stringify(updatedSteps) });
                if (onStopTask) await onStopTask(focusTask.id);
            } else {
                await onUpdateTask(focusTask.id, { subtasksJson: JSON.stringify(updatedSteps) });
                setIsActive(true); // Auto-start the next step
            }
        } else {
            if (onStopTask) await onStopTask(focusTask.id);
        }
    };
    
    // Add skip logic for rituals
    const handleSkipStep = async () => {
        if (!focusTask || !focusTask.isRitual || !activeStep || !onUpdateTask) return;
        const updatedSteps = ritualSteps.map((s: any) => 
            s.id === activeStep.id ? { ...s, completed: true } : s
        );
        const isLastStep = updatedSteps.every((s: any) => s.completed);
        
        if (isLastStep) {
            setShowReward(true);
            await onUpdateTask(focusTask.id, { subtasksJson: JSON.stringify(updatedSteps) });
            if (onStopTask) await onStopTask(focusTask.id);
        } else {
            await onUpdateTask(focusTask.id, { subtasksJson: JSON.stringify(updatedSteps) });
            setIsActive(true); 
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
                <div className="flex gap-6 mb-12">
                    <div className="flex flex-col items-center bg-[var(--card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--border)] min-w-[120px]">
                        <span className="text-3xl font-bold text-emerald-600 mb-1">+1</span>
                        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Day Streak</span>
                    </div>
                    <div className="flex flex-col items-center bg-[var(--card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--border)] min-w-[120px]">
                        <span className="text-3xl font-bold text-teal-600 mb-1">+15</span>
                        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Focus Points</span>
                    </div>
                </div>
                <button 
                    onClick={() => { setShowReward(false); setTab && setTab('TODAY'); }}
                    className="btn-primary flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all transform hover:scale-105"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

    // SVG ring constants
    const size = 300;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const presets = [
        { label: '25m', mins: 25 },
        { label: '50m', mins: 50 },
        { label: '90m', mins: 90 },
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in relative">
            
            {/* Simplified Background */}
            <div className="absolute inset-0 bg-[var(--bg-main)] z-0" />

            {/* Session Preset Bar */}
            <div className="relative z-10 w-full max-w-xs flex p-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg mb-12">
                {presets.map(p => (
                    <button
                        key={p.mins}
                        onClick={() => setPreset(p.mins)}
                        className={clsx(
                            "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                            durationMins === p.mins 
                                ? "bg-gray-100 text-[var(--accent)]" 
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Focused Objective Card */}
            <div className="relative z-10 text-center mb-16 px-6 w-full max-w-sm">
                {activeTaskTitle ? (
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[var(--accent-soft)] rounded-full">
                            <div className={clsx("w-1.5 h-1.5 rounded-full bg-[var(--accent)]", isActive && "animate-pulse")} />
                            <span className="text-[10px] font-semibold text-[var(--accent)]">
                                {activeTaskSource}
                            </span>
                        </div>
                        <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
                            {activeTaskTitle}
                        </h2>
                        
                        {focusTask?.isRitual && ritualSteps.length > 0 && (
                            <div className="flex items-center justify-center gap-2 mt-2 mb-4">
                                {ritualSteps.map((step: any, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className={clsx(
                                            "h-1.5 rounded-full transition-all duration-500",
                                            step.completed ? "w-4 bg-emerald-500" : (idx === activeStepIndex ? "w-6 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "w-1.5 bg-[var(--border)]")
                                        )}
                                    />
                                ))}
                            </div>
                        )}

                        {sessionLabel && !focusTask?.isRitual && (
                            <p className="text-xs text-[var(--text-secondary)]">
                                Session {sessionLabel}
                            </p>
                        )}
                        
                        <div className="flex flex-col gap-2 mt-6">
                            {(!focusTask?.isRitual || focusTask?.isRitual) && (
                                <button
                                    onClick={handleCompleteTask}
                                    className="btn-primary !h-10 text-sm shadow-md"
                                >
                                    {focusTask?.isRitual && activeStep ? "Complete Step" : "Complete task"}
                                </button>
                            )}
                            {focusTask?.isRitual ? (
                                <button
                                    onClick={handleSkipStep}
                                    className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all mt-2"
                                >
                                    Skip this step
                                </button>
                            ) : (
                                <button
                                    onClick={() => setTab && setTab('TODAY')}
                                    className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
                                >
                                    Change task
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card p-8 border-dashed flex flex-col items-center" onClick={() => setTab && setTab('TODAY')}>
                        <p className="text-xs text-[var(--text-secondary)] mb-4">No task selected</p>
                        <button
                            className="btn-secondary w-full text-xs flex items-center justify-center gap-2"
                        >
                            Select a task
                            <svg className="group-hover:translate-x-1 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Central Chronometer */}
            <div className="relative z-10 w-[300px] h-[300px] mb-12 flex items-center justify-center group">
                <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                    <circle cx={center} cy={center} r={radius} fill="transparent" className="stroke-gray-100" strokeWidth={strokeWidth} />
                    <circle
                        cx={center} cy={center} r={radius} fill="transparent"
                        stroke="var(--accent)" strokeWidth={strokeWidth}
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round" className="transition-all duration-1000 ease-linear"
                    />
                </svg>

                <div className="relative text-center">
                    <div className="text-7xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tighter leading-none mb-3">
                        {formatTime(timeLeft)}
                    </div>
                    <div className={clsx(
                        "text-xs font-medium transition-all",
                        isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]/40"
                    )}>
                        {isActive ? 'Timer running' : 'Ready'}
                    </div>
                </div>
            </div>

            {/* Core Controls */}
            <div className="relative z-10 flex items-center gap-8 mb-12">
                <button
                    onClick={() => { setTimeLeft(totalDuration); setIsActive(false); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-gray-100 hover:text-[var(--text-primary)] transition-all"
                    data-testid="timer-reset"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>

                <button
                    onClick={toggleTimer}
                    data-testid="timer-toggle"
                    className={clsx(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95",
                        isActive 
                            ? "bg-gray-100 text-[var(--accent)]" 
                            : "bg-[var(--accent)] text-white"
                    )}
                >
                    {isActive ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                    ) : (
                        <svg className="ml-1" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                    )}
                </button>

                <button
                    onClick={handleLogDistraction}
                    data-testid="distraction-button"
                    className={clsx(
                        "w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all",
                        distractions > 0 ? "text-amber-500 bg-amber-50" : "text-[var(--text-secondary)] hover:bg-gray-100 hover:text-[var(--text-primary)]"
                    )}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                    {distractions > 0 && <span className="text-[10px] font-semibold">{distractions}</span>}
                </button>
            </div>

            {/* Diagnostics Bar */}
            <div className="relative z-10 w-full max-w-[340px] flex p-4 card rounded-xl">
                <div className="flex-1 text-center">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Soundscape</p>
                    <select
                        value={ambientSound}
                        onChange={e => setAmbientSound(e.target.value)}
                        className="bg-transparent text-xs font-medium text-[var(--text-primary)] outline-none cursor-pointer hover:text-[var(--accent)] transition-colors text-center w-full appearance-none"
                    >
                        <option value="none">None</option>
                        <option value="rain">Rain</option>
                        <option value="cafe">Cafe</option>
                        <option value="noise">White noise</option>
                    </select>
                </div>
                <div className="w-px bg-[var(--border)] mx-4 self-stretch" />
                <div className="flex-1 text-center cursor-pointer group" onClick={handleLogDistraction}>
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Distractions</p>
                    <p className={clsx(
                        "text-lg font-semibold transition-colors",
                        distractions > 0 ? "text-amber-500" : "text-[var(--text-primary)]"
                    )}>
                        {distractions.toString().padStart(2, '0')}
                    </p>
                </div>
            </div>
        </div>
    );
}
