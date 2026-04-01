import React from 'react';
import { clsx } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  setTab: (tab: string) => void;
  onNewTask: () => void;
  userName: string;
  isAdmin?: boolean;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, setTab, onNewTask, userName, isAdmin, isMobile, isOpen, onClose }: SidebarProps) {
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
        ), label: 'Stats' },
        { id: 'TRASH', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        ), label: 'Trash' }
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

    const sidebarClasses = clsx(
        "h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col p-4 overflow-hidden transition-transform duration-300 z-[100]",
        isMobile ? "fixed inset-y-0 left-0 w-[260px] shadow-2xl" : "relative w-[240px] min-w-[240px]",
        isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
    );

    const content = (
        <>
            {/* Brand + Close (Mobile) */}
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabClick('TODAY')}>
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold">
                        N
                    </div>
                    <span className="font-semibold tracking-tight text-[var(--text-primary)] text-lg italic">Nexus</span>
                </div>
                {isMobile && (
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-200 text-[var(--text-secondary)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                )}
            </div>

            {/* New Task Button */}
            {!isAdmin && (
                <div className="mb-8 px-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onNewTask(); }}
                        className="btn-primary w-full gap-2"
                    >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New task
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-1 relative overflow-y-auto scrollbar-hide">
                {items.map(item => {
                    const active = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={clsx(
                                "sidebar-item group",
                                active && "sidebar-item-active"
                            )}
                        >
                            <span className={clsx(
                                "flex items-center justify-center transition-colors duration-200",
                                active ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
                            )}>
                                {item.icon}
                            </span>
                            <span className={clsx(
                                "transition-colors duration-200",
                                active ? "font-semibold" : "group-hover:text-[var(--text-primary)]"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-[var(--border)] flex flex-col gap-2">
                <div className="flex items-center gap-3 px-2 py-2 group">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-primary)] font-semibold">
                        {isAdmin ? 'AD' : 'UI'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {userName.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                            {isAdmin ? 'Administrator' : 'User'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => document.documentElement.classList.toggle('dark')}
                        className="flex items-center gap-3 px-3 h-9 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)] transition-all"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        Dark Mode
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); logout(); }}
                        className="flex items-center gap-3 px-3 h-9 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-red-50 hover:text-[var(--accent)] transition-all group/exit"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Logout
                    </button>
                </div>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <>
                {/* Backdrop */}
                <div 
                    className={clsx(
                        "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300",
                        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
                    )}
                    onClick={onClose}
                />
                <aside className={sidebarClasses}>
                    {content}
                </aside>
            </>
        );
    }

    return (
        <aside className={sidebarClasses}>
            {content}
        </aside>
    );
}
