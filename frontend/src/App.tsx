import React, { useState } from 'react';
import { useAuthContext } from './context/AuthContext';
import { useToast } from './components/ToastProvider';
import { useTasks } from './hooks/useTasks';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import HabitTrackerPage from './pages/HabitTrackerPage';
import AdminPage from './pages/AdminPage';
import TodoInput from './components/TodoInput';
import FocusTimer from './components/FocusTimer';
import InsightsDashboard from './components/InsightsDashboard';
import DailyPlanner from './components/DailyPlanner';
import WeeklyCalendar from './components/WeeklyCalendar';
import TodoItem from './components/TodoItem';
import TrashPage from './pages/TrashPage';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  const { tasks, addTask, updateTask, deleteTask, startTask, pauseTask, stopTask } = useTasks(user?.uid);
  const { success } = useToast() || {};
  const [tab, setTab] = useState('TODAY');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputContext, setInputContext] = useState<{ date?: string, time?: string } | null>(null);

  const openTaskModal = (context?: { date?: string, time?: string }) => {
    setInputContext(context || null);
    setIsInputOpen(true);
  };
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (authLoading) {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Loading...</span>
            </div>
        </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => success?.("Welcome back!")} />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] relative overflow-hidden">
      <Sidebar 
          activeTab={tab} 
          setTab={setTab} 
          onNewTask={() => openTaskModal()} 
          userName={user.email || 'User'}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden selection:bg-[var(--accent-soft)] selection:text-[var(--accent)] relative z-0">
        {/* Background layer: Minimal */}
        <div className="absolute inset-0 bg-[var(--bg-main)] z-[-1]" />

        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8 pb-32 animate-slide-up relative z-10">
           {tab === 'TODAY' && <DashboardPage />}
            {tab === 'PLANNER' && (
                <DailyPlanner 
                    todos={tasks} 
                    selectedDate={selectedDate} 
                    onUpdateMetadata={(id, updates) => updateTask(id, updates)} 
                    onStartTask={startTask}
                    onPauseTask={pauseTask}
                    onStopTask={stopTask}
                    onCreateInSlot={(date, time) => openTaskModal({ date, time })}
                />
            )}
           {tab === 'WEEKLY' && (
               <div className="space-y-12">
                   <WeeklyCalendar 
                       selectedDate={selectedDate} 
                       onSelectDate={setSelectedDate} 
                   />
                   
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                       <div className="lg:col-span-2 space-y-4">
                           <div className="flex justify-between items-center px-1">
                               <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tasks for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h3>
                           </div>
                           
                           <div className="space-y-4">
                               {tasks.filter(t => t.dueDate === selectedDate && !t.deleted).length > 0 ? (
                                   tasks.filter(t => t.dueDate === selectedDate && !t.deleted).map(todo => (
                                       <TodoItem 
                                           key={todo.id} 
                                           todo={todo} 
                                           onToggle={(t) => updateTask(t.id, { completed: !t.completed })} 
                                           onDelete={() => updateTask(todo.id, { deleted: true })} 
                                           onUpdateMetadata={(id, updates) => updateTask(id, updates)}
                                           onStartTask={startTask}
                                           onPauseTask={pauseTask}
                                           onStopTask={stopTask}
                                       />
                                   ))
                               ) : (
                                   <div className="card p-12 text-center border-dashed">
                                       <p className="text-sm text-[var(--text-secondary)]">No tasks found for this date</p>
                                   </div>
                               )}
                           </div>
                       </div>
                       
                       <div className="space-y-6">
                           <div className="card p-6">
                               <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-4">Upcoming milestones</h4>
                               <div className="space-y-3">
                                   {tasks.filter(t => t.dueDate > selectedDate && !t.completed && !t.deleted).slice(0, 3).map(t => (
                                       <div key={t.id} className="flex items-center gap-3">
                                           <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                           <div className="flex-1 min-w-0">
                                               <p className="text-sm font-medium text-[var(--text-primary)] truncate">{t.title}</p>
                                               <p className="text-[10px] text-[var(--text-secondary)]">{new Date(t.dueDate).toLocaleDateString()}</p>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           )}
           {tab === 'HABITS' && <HabitTrackerPage />}
           {tab === 'FOCUS' && (
               <FocusTimer 
                   focusTask={tasks.find(t => t.status === 'IN_PROGRESS') || tasks.find(t => !t.completed && !t.deleted) || null} 
                   setTab={(id) => { console.log('DEBUG: setTab called from FocusTimer with', id); setTab(id); }} 
                   onUpdateTask={updateTask}
                   onStartTask={startTask}
                   onPauseTask={pauseTask}
                   onStopTask={stopTask}
               />
           )}
           {tab === 'INSIGHTS' && (
               <InsightsDashboard 
                   todos={tasks} 
                   setTab={(id) => { console.log('DEBUG: setTab called from Insights with', id); setTab(id); }} 
               />
           )}
           {tab === 'TRASH' && <TrashPage />}
           {tab === 'ADMIN' && <AdminPage />}
        </div>
      </main>

      <TodoInput 
          isOpen={isInputOpen} 
          onClose={() => setIsInputOpen(false)} 
          selectedDate={selectedDate}
          initialDueDate={inputContext?.date}
          initialDueTime={inputContext?.time}
          onAdd={addTask}
      />
    </div>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
