import { useAuthContext } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import TaskSkeleton from '../components/TaskSkeleton';
import { clsx } from '../lib/utils';

export default function TrashPage() {
    const { user } = useAuthContext();
    const { tasks, loading, restoreTask, purgeTask } = useTasks(user?.uid, true);

    if (loading) return <TaskSkeleton />;

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Trash</h1>
                <p className="text-xs text-[var(--text-secondary)]">
                    Items here were deleted. You can restore them or delete them permanently.
                </p>
            </div>

            <div className="card divide-y divide-[var(--border)] overflow-hidden">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <div key={task.id} className="group relative px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all">
                            <div className="flex flex-col gap-1">
                                <span className={clsx(
                                    "text-sm font-medium",
                                    task.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                                )}>
                                    {task.title}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)]/60">
                                    Deleted from: {task.category || 'General'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => restoreTask(task.id)}
                                    className="px-3 py-1.5 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-md transition-all"
                                >
                                    Restore
                                </button>
                                <button
                                    onClick={() => purgeTask(task.id)}
                                    className="px-3 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-md transition-all"
                                >
                                    Delete forever
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]/20">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Trash is empty</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Items you delete will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
