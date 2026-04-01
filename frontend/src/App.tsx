import React, { useState } from 'react';
import { useAuthContext } from './context/AuthContext';
import { useToast } from './components/ToastProvider';
import { useTasks } from './hooks/useTasks';
import Sidebar from './components/Sidebar';
import { lazy, Suspense } from 'react';
import TaskSkeleton from './components/TaskSkeleton';

const AuthPage = lazy(() => import('./pages/AuthPage')) as React.ComponentType<{ onAuthSuccess: () => void }>;
const DashboardPage = lazy(() => import('./pages/DashboardPage')) as React.ComponentType<{ setTab: (t: string) => void }>;
const HabitTrackerPage = lazy(() => import('./pages/HabitTrackerPage')) as React.ComponentType<{ setTab?: (t: string) => void }>;
const AdminPage = lazy(() => import('./pages/AdminPage'));
const FocusTimer = lazy(() => import('./components/FocusTimer')) as React.ComponentType<any>;
const InsightsDashboard = lazy(() => import('./components/InsightsDashboard')) as React.ComponentType<{ todos: any[]; setTab: (t: string) => void }>;
const DailyPlanner = lazy(() => import('./components/DailyPlanner')) as React.ComponentType<{ todos: any[]; selectedDate: string; onUpdateMetadata: (id: string, updates: any) => void; onStartTask?: (id: string) => void; onPauseTask?: (id: string) => void; onStopTask?: (id: string) => void; onCreateInSlot?: (date: string, time: string) => void }>;
const WeeklyCalendar = lazy(() => import('./components/WeeklyCalendar')) as React.ComponentType<{ selectedDate: string; onSelectDate: (d: string) => void; onCreateInDate?: (date: string) => void }>;
const TrashPage = lazy(() => import('./pages/TrashPage')) as React.ComponentType<any>;

import TodoInput from './components/TodoInput';
import { clsx } from './lib/utils';
import TodoItem from './components/TodoItem';
import { useIsMobile } from './hooks/useIsMobile';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  const { 
      tasks, rituals, addTask, updateTask, deleteTask, startTask, pauseTask, stopTask, 
      executeProtocol 
  } = useTasks(user?.uid);
  const { success } = useToast() || {};
  const [tab, setTab] = useState('TODAY');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputContext, setInputContext] = useState<{ date?: string, time?: string } | null>(null);
  
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openTaskModal = (context?: { date?: string, time?: string }) => {
    setInputContext(context || null);
    setIsInputOpen(true);
  };
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const allActiveItems = [...tasks, ...(rituals || [])];
  const activeExecutionTask = allActiveItems.find(t => t.isExecutionMode && !t.isLocked && !t.completed && !t.deleted);
  const inProgressTask = allActiveItems.find(t => t.status === 'IN_PROGRESS' && !t.deleted);
  const defaultPending = allActiveItems.find(t => !t.completed && !t.deleted);
  const currentFocusTask = activeExecutionTask || inProgressTask || defaultPending || null;

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
    return (
        <Suspense fallback={<TaskSkeleton />}>
           <AuthPage onAuthSuccess={() => success?.("Welcome back!")} />
        </Suspense>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[var(--bg-main)] text-[var(--text-primary)] relative overflow-x-hidden">
      
       {/* Mobile Top Header (Just Brand) */}
      {isMobile && (
        <header className="h-14 min-h-[56px] bg-[var(--bg-main)] flex items-center justify-between px-4 z-40 sticky top-0">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs">
                 N
             </div>
             <span className="font-semibold tracking-tight text-[var(--text-primary)] italic">Nexus</span>
          </div>
        </header>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      {!isMobile && (
          <Sidebar 
              activeTab={tab} 
              setTab={setTab} 
              onNewTask={() => openTaskModal()} 
              userName={user.email || 'User'}
              isAdmin={(user as any)?.isAdmin}
          />
      )}

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-0">
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-6 pb-24 md:pb-32 animate-slide-up relative z-10 w-full min-h-screen">
          <Suspense fallback={<TaskSkeleton />}>
              {tab === 'TODAY' && (
                <div className="animate-fade-in">
                  <DashboardPage setTab={setTab} />
                </div>
              )}
              
              {tab === 'PLANNER' && (
                <div className="animate-fade-in flex flex-col gap-6">
                    <WeeklyCalendar 
                        selectedDate={selectedDate} 
                        onSelectDate={(d) => setSelectedDate(d)} 
                        onCreateInDate={(d) => openTaskModal({ date: d })} 
                    />
                    <div className="h-[1px] bg-[var(--border)] my-4 w-full"></div>
                    <DailyPlanner 
                        todos={tasks}
                        selectedDate={selectedDate} 
                        onUpdateMetadata={(id, updates) => updateTask(id, updates)} 
                        onStartTask={startTask}
                        onPauseTask={pauseTask}
                        onStopTask={stopTask}
                        onCreateInSlot={(date, time) => openTaskModal({ date, time })}
                    />
                </div>
              )}

              {tab === 'FOCUS' && (
                <div className="max-w-xl mx-auto h-full flex items-center justify-center animate-scale-in py-12">
                  <FocusTimer 
                    focusTask={currentFocusTask} 
                    setTab={setTab} 
                    onUpdateTask={updateTask}
                    onStartTask={startTask}
                    onPauseTask={pauseTask}
                    onStopTask={stopTask}
                  />
                </div>
              )}

              {tab === 'HABITS' && (
                <div className="animate-fade-in">
                  <HabitTrackerPage setTab={setTab} />
                </div>
              )}

              {tab === 'INSIGHTS' && (
                <div className="animate-fade-in">
                  <InsightsDashboard todos={tasks} setTab={setTab} />
                </div>
              )}

              {tab === 'TRASH' && (
                <div className="animate-fade-in">
                  <TrashPage />
                </div>
              )}

              {tab === 'ADMIN' && (
                <div className="animate-fade-in">
                  <AdminPage />
                </div>
              )}
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--card-bg)] border-t border-[var(--border)] flex items-center justify-around px-2 pb-safe z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              {[
                  { id: 'TODAY', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: 'Today' },
                  { id: 'FOCUS', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: 'Focus' },
                  { id: 'NEW', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>, label: 'Add', isPrimary: true },
                  { id: 'PLANNER', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2v4M10 2v4M3 8h18M3 14h18M3 20h18M4 4h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>, label: 'Plan' },
                  { id: 'INSIGHTS', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: 'Stats' },
              ].map(item => {
                  if (item.isPrimary) {
                      return (
                          <button 
                              key={item.id}
                              onClick={() => openTaskModal()}
                              className="w-12 h-12 bg-[var(--accent)] rounded-full text-white flex items-center justify-center transform -translate-y-4 shadow-[0_4px_12px_rgba(239,68,68,0.3)] active:scale-95 transition-transform"
                          >
                              {item.icon}
                          </button>
                      );
                  }
                  
                  const active = tab === item.id;
                  return (
                      <button 
                          key={item.id}
                          onClick={() => setTab(item.id)}
                          className={clsx(
                              "flex flex-col items-center justify-center w-14 gap-1 p-1 transition-all",
                              active ? "text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          )}
                      >
                          <div className={clsx("transition-transform", active && "scale-110")}>
                               {item.icon}
                          </div>
                          <span className="text-[10px] font-semibold">{item.label}</span>
                      </button>
                  );
              })}
          </nav>
      )}

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
