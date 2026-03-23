import React, { useState, useEffect } from 'react';
import { logService } from '../services/logService';
import { AppLog } from '../types';
import { clsx } from '../lib/utils';

export default function AdminPage() {
    const [logs, setLogs] = useState<AppLog[]>([]);

    useEffect(() => {
        const unsubscribe = logService.subscribeToLogs((fetchedLogs) => {
            setLogs(fetchedLogs);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="space-y-10 p-6 md:p-10">
            <header>
                <h1 className="text-3xl font-semibold text-[var(--text-primary)] tracking-tight mb-2">Admin dashboard</h1>
                <p className="text-sm text-[var(--text-secondary)]">Monitor system activity and user actions.</p>
            </header>

            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Activity logs</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-gray-50/50">
                                <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">User ID</th>
                                <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-[var(--text-secondary)] font-mono text-xs">
                                        {log.timestamp?.toDate?.()?.toLocaleString() || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-primary)] text-xs font-medium">{log.userId}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-[var(--text-primary)]">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
