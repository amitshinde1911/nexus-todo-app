import React from 'react';
import { clsx } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  setTab: (tab: string) => void;
  onNewTask: () => void;
  userName: string;
  isAdmin?: boolean;
}

export default function Sidebar({ activeTab, setTab, onNewTask, userName, isAdmin }: SidebarProps) {
    const { logout } = useAuth();
    
    const items = [
        { id: 'TODAY', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ), label: 'Today' },
        { id: 'PLANNER', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4M10 2v4M3 8h18M3 14h18M3 20h18M4 4h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>
        ), label: 'Schedule' },
        { id: 'WEEKLY', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ), label: 'Calendar' },
        { id: 'HABITS', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        ), label: 'Habits' },
        { id: 'FOCUS', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ), label: 'Timer' },
        { id: 'INSIGHTS', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        ), label: 'Stats' }
    ];

    if (isAdmin) {
        items.push({ id: 'ADMIN', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        ), label: 'Admin Panel' });
    }

    const handleTabClick = (id: string) => {
        console.log('DEBUG: Sidebar click on', id);
        setTab(id);
    };

    return (
        <aside className="relative z-[100] w-[240px] min-w-[240px] h-screen bg-[var(--bg-sidebar)] border-r border-black/5 flex flex-col px-4 py-10 overflow-hidden">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-12 px-2 group cursor-pointer" onClick={() => handleTabClick('TODAY')}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-[#9B8FFF] flex items-center justify-center text-white font-black shadow-lg shadow-[var(--accent)]/20">
                    N
                </div>
                <span className="font-bold tracking-[0.2em] text-[var(--text-primary)] text-[11px] uppercase">Nexus Protocol</span>
            </div>

            {/* New Task Button */}
            {!isAdmin && (
                <div className="mb-12 px-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onNewTask(); }}
                        className="btn-primary w-full gap-2 shadow-[0_8px_20px_rgba(124,108,255,0.2)]"
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        INITIATE
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-2 relative">
                {items.map(item => {
                    const active = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={clsx(
                                "sidebar-item group relative z-[51]",
                                active && "sidebar-item-active"
                            )}
                        >
                            <span className={clsx(
                                "flex items-center justify-center w-5 h-5 transition-all duration-300",
                                active ? "text-[var(--accent)] scale-110" : "opacity-60 group-hover:opacity-100"
                            )}>
                                {item.icon}
                            </span>
                            <span className={clsx(
                                "transition-colors duration-300",
                                active ? "text-[var(--text-primary)]" : "group-hover:text-[var(--text-primary)]"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-white/[0.03] flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2 group cursor-pointer">
                    <div className="relative w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[10px] text-[var(--text-primary)] font-black group-hover:border-[var(--accent)]/30 transition-all overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-blue-500 opacity-10 blur-md pointer-events-none" />
                        <span className="relative z-10">{isAdmin ? 'SU' : 'A'}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">
                            {userName.split('@')[0]}
                        </span>
                        <span className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest">
                            {isAdmin ? 'System Admin' : 'Active Tier'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1 relative z-[60]">
                    <button
                        onClick={() => document.documentElement.classList.toggle('dark')}
                        className="flex items-center gap-3 px-3 h-10 rounded-xl text-[9px] font-black text-[var(--text-secondary)]/40 hover:bg-white/[0.03] hover:text-[var(--text-primary)] transition-all duration-300 uppercase tracking-[0.2em]"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        Interface
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); console.log('DEBUG: Terminate button clicked'); logout(); }}
                        className="flex items-center gap-3 px-3 h-10 rounded-xl text-[9px] font-black text-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 uppercase tracking-[0.2em] group/exit"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Terminate
                    </button>
                </div>
            </div>
        </aside>
    );
}
