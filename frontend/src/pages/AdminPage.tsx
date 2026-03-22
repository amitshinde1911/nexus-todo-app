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
        <div className="space-y-12 p-8">
            <header>
                <h1 className="text-6xl font-black text-white tracking-tighter mb-4 italic italic">COMMAND CENTER</h1>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.5em] opacity-40">System-wide monitoring & activity metrics.</p>
            </header>

            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden">
                <div className="p-8 border-b border-white/10 bg-white/5">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Real-time Telemetry</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-black/20">
                                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Agent</th>
                                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action</th>
                                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Protocol Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6 text-white font-mono text-xs opacity-50">
                                        {log.timestamp?.toDate?.()?.toLocaleString() || 'N/A'}
                                    </td>
                                    <td className="px-8 py-6 text-white text-xs font-bold">{log.userId}</td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-muted-foreground text-xs">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
