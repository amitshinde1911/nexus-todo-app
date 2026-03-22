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

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  const { tasks, addTask, updateTask } = useTasks(user?.uid);
  const { success } = useToast() || {};
  const [tab, setTab] = useState('TODAY');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (authLoading) {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-blue-500 animate-[spin_2s_linear_infinite]" />
                <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.4em]">Initializing Nexus</span>
            </div>
        </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => success?.("Sequence Initialized. Protocol Access Granted.")} />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] relative overflow-hidden">
      <Sidebar 
          activeTab={tab} 
          setTab={setTab} 
          onNewTask={() => setIsInputOpen(true)} 
          userName={user.email || 'Agent'}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden selection:bg-[var(--accent-soft)] selection:text-[var(--accent)] relative z-0">
        {/* Premium Background Layers - Strictly Isolated & Contained */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[var(--accent)] opacity-[0.01] blur-[80px] rounded-full translate-x-[10%] -translate-y-[10%]" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-blue-500/5 blur-[80px] rounded-full -translate-x-[10%] translate-y-[10%]" />
        </div>

        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8 pb-32 animate-slide-up relative z-10">
           {tab === 'TODAY' && <DashboardPage />}
           {tab === 'PLANNER' && (
               <DailyPlanner 
                   todos={tasks} 
                   selectedDate={selectedDate} 
                   onUpdateMetadata={(id, updates) => updateTask(id, updates)} 
               />
           )}
           {tab === 'WEEKLY' && (
               <div className="space-y-12">
                   <WeeklyCalendar 
                       selectedDate={selectedDate} 
                       onSelectDate={setSelectedDate} 
                   />
                   
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                       <div className="lg:col-span-2 space-y-6">
                           <div className="flex justify-between items-center px-2">
                               <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Intentions for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h3>
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
                                       />
                                   ))
                               ) : (
                                   <div className="glass-card p-12 text-center border-dashed border-white/5">
                                       <p className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-[0.2em]">Zero Intentions Matched</p>
                                   </div>
                               )}
                           </div>
                       </div>
                       
                       <div className="space-y-8">
                           <div className="glass-card p-8">
                               <h4 className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-[0.2em] mb-6">Upcoming Milestones</h4>
                               <div className="space-y-4">
                                   {tasks.filter(t => t.dueDate > selectedDate && !t.completed && !t.deleted).slice(0, 3).map(t => (
                                       <div key={t.id} className="flex items-center gap-3">
                                           <div className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                                           <div className="flex-1 min-w-0">
                                               <p className="text-[10px] font-bold text-[var(--text-primary)] truncate">{t.title}</p>
                                               <p className="text-[8px] text-[var(--text-secondary)]/40 uppercase font-black">{new Date(t.dueDate).toLocaleDateString()}</p>
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
                   focusTask={tasks.find(t => !t.completed && !t.deleted) || null} 
                   setTab={(id) => { console.log('DEBUG: setTab called from FocusTimer with', id); setTab(id); }} 
                   onUpdateTask={updateTask}
               />
           )}
           {tab === 'INSIGHTS' && (
               <InsightsDashboard 
                   todos={tasks} 
                   setTab={(id) => { console.log('DEBUG: setTab called from Insights with', id); setTab(id); }} 
               />
           )}
           {tab === 'ADMIN' && <AdminPage />}
        </div>
      </main>

      <TodoInput 
          isOpen={isInputOpen} 
          onClose={() => setIsInputOpen(false)} 
          selectedDate={selectedDate}
          onAdd={addTask}
      />
    </div>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
