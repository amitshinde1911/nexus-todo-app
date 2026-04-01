import { useState, useEffect } from 'react';
import { Task } from '../types';

interface Step {
    id: string;
    title: string;
    duration: number; // in minutes
    completed: boolean;
}

interface RoutineBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: Task | undefined;
    onSave: (title: string, steps: Step[]) => Promise<void>;
}

export default function RoutineBuilderModal({ isOpen, onClose, template, onSave }: RoutineBuilderModalProps) {
    const [title, setTitle] = useState('Morning Protocol');
    const [steps, setSteps] = useState<Step[]>([]);
    
    useEffect(() => {
        if (template && isOpen) {
            setTitle(template.title);
            if (template.subtasksJson) {
                try {
                    setSteps(JSON.parse(template.subtasksJson));
                } catch(e) { }
            }
        } else if (isOpen && !template) {
            // Default setup if no template exists
            setSteps([
                { id: crypto.randomUUID(), title: "Wake up & Hydrate", duration: 5, completed: false },
                { id: crypto.randomUUID(), title: "Deep Focus Setup", duration: 15, completed: false }
            ]);
        }
    }, [template, isOpen]);

    if (!isOpen) return null;

    const handleAddStep = () => {
        setSteps([...steps, { id: crypto.randomUUID(), title: "", duration: 5, completed: false }]);
    };

    const handleUpdateStep = (id: string, field: keyof Step, value: any) => {
        setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleDeleteStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        // filter out empty title
        const validSteps = steps.filter(s => s.title.trim() !== "");
        await onSave(title, validSteps);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--card-bg)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Protocol Builder</h2>
                    <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--hover)] transition-all rounded-full">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Protocol Name</label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-dashed border-[var(--border)] outline-none py-2 text-xl font-bold text-[var(--text-primary)] focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-secondary)]/30"
                            placeholder="e.g. My Morning Routine"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Execution Steps</label>
                        
                        <div className="space-y-3">
                            {steps.map((step, idx) => (
                                <div key={step.id} className="flex items-center gap-3 p-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl group/step transition-all focus-within:border-[var(--accent)] hover:border-[var(--text-secondary)]/30">
                                    <div className="flex flex-col items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] w-6 h-6 rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    
                                    <input 
                                        type="text"
                                        value={step.title}
                                        onChange={(e) => handleUpdateStep(step.id, 'title', e.target.value)}
                                        placeholder="Step description..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal"
                                    />

                                    <div className="flex items-center gap-2 bg-[var(--card-bg)] px-2 py-1.5 rounded-md border border-[var(--border)] flex-shrink-0">
                                        <input 
                                            type="number"
                                            value={step.duration}
                                            onChange={(e) => handleUpdateStep(step.id, 'duration', parseInt(e.target.value) || 0)}
                                            className="w-10 bg-transparent border-none outline-none text-right text-xs font-semibold text-[var(--text-primary)]"
                                            min="1"
                                            max="120"
                                        />
                                        <span className="text-[10px] text-[var(--text-secondary)] font-medium uppercase">min</span>
                                    </div>

                                    <button 
                                        onClick={() => handleDeleteStep(step.id)}
                                        className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover/step:opacity-100"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={handleAddStep}
                            className="w-full py-4 border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/20 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add New Step
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-main)]">
                    <button 
                        onClick={handleSave}
                        disabled={steps.filter(s => s.title.trim()).length === 0}
                        className="btn-primary w-full !h-12 text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Protocol
                    </button>
                </div>
                
            </div>
        </div>
    );
}
