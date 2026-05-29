import React, { useState, useMemo } from 'react';
import { SmsLog } from '../types';
import { RefreshCw, Search, Trash2, CheckCircle, AlertOctagon, Clock, Database, Eye, Info, Send } from 'lucide-react';

interface LogsListProps {
  logs: SmsLog[];
  onClearLogs: () => void;
}

export default function LogsList({ logs, onClearLogs }: LogsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Filter dynamic logs list based on query and status selections
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch =
        log.phone.includes(searchQuery) ||
        (log.name && log.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || log.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  // Selected details logging view modal state
  const selectedLog = useMemo(() => {
    return logs.find(l => l.id === selectedLogId);
  }, [logs, selectedLogId]);

  return (
    <div id="logs-management" className="space-y-6">
      {/* Search and filters heading */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matching number, text..."
            className="w-full text-xs pl-8 pr-3 py-2 text-slate-700 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Filters and resets */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg p-2 outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">-- All Delivery Status --</option>
            <option value="delivered">Delivered</option>
            <option value="sent">Sent (Pending DLR)</option>
            <option value="pending">Scheduled Queue</option>
            <option value="failed">Delivery Failed</option>
          </select>

          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-100 hover:border-transparent px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 size={13} /> Clear Logs
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main tracking table */}
        <div className={`${selectedLogId ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white p-6 rounded-xl border border-slate-100 shadow-xs transition-all`}>
          <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Delivery Audit records Logs</h4>
              <p className="text-xs text-slate-400">Chronological list of all outgoing and custom API requests</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">Showing {filteredLogs.length} matching rows</span>
          </div>

          <div className="overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Database size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs font-semibold">No SMS transaction records detected</p>
                <p className="text-[11px] mt-1">Change filters or initiate a shortcut SMS on the compose side</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left text-slate-500 whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest leading-normal">
                    <th className="py-3 px-2 font-black">Destination info</th>
                    <th className="py-3 px-2 font-black">SMS text block</th>
                    <th className="py-3 px-2 font-black">Status DLR</th>
                    <th className="py-3 px-2 font-black">Gate target</th>
                    <th className="py-3 px-2 font-black">Timestamp</th>
                    <th className="py-3 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id === selectedLogId ? null : log.id)}
                      className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        log.id === selectedLogId ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{log.name || 'Value Receptor'}</span>
                          <span className="font-mono text-[10px] text-slate-400 tabular-nums">{log.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 max-w-xs truncate" title={log.content}>
                        {log.content}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                          log.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          log.status === 'sent' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          log.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {log.status === 'delivered' && <CheckCircle size={10} />}
                          {log.status === 'sent' && <Send size={10} />}
                          {log.status === 'pending' && <Clock size={10} />}
                          {log.status === 'failed' && <AlertOctagon size={10} />}
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                        {log.gatewayName}
                      </td>
                      <td className="py-3 px-2 font-mono text-[10px] text-slate-400 tabular-nums">
                        {new Date(log.timestamp).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-slate-50 border border-slate-100 cursor-pointer">
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Selected Log Side panel info details dynamic drawer */}
        {selectedLogId && selectedLog && (
          <div className="lg:col-span-4 bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-800 space-y-5 shadow-lg animate-in fade-in slide-in-from-right-3 duration-250">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Info size={11} /> Request metadata parameters
              </span>
              <button
                onClick={() => setSelectedLogId(null)}
                className="text-slate-400 hover:text-slate-100 text-xs font-bold font-mono px-1 hover:bg-slate-800 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Recipient</span>
                  <p className="text-xs font-bold text-slate-100">{selectedLog.name || 'Anonymous'}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Phone Mobile</span>
                  <p className="text-xs font-bold font-mono text-indigo-400 tracking-wider tabular-nums">{selectedLog.phone}</p>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Selected Outbound Gateway</span>
                <p className="text-[10px] font-mono bg-slate-800 rounded-md py-1 px-2 border border-slate-800 text-slate-300 w-fit">
                  {selectedLog.gatewayName}
                </p>
              </div>

              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Dispatched SMS Text Payload</span>
                <p className="text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-850 text-slate-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all font-sans">
                  {selectedLog.content}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Message Segments</span>
                  <p className="text-xs font-bold font-mono text-slate-200">{selectedLog.chunksCount} part(s)</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Cost impact estim.</span>
                  <p className="text-xs font-bold font-mono text-indigo-400">{(selectedLog.chunksCount * 0.1).toFixed(2)} credits</p>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Provider Response Summary</span>
                <pre className="text-[10px] bg-slate-950 p-2.5 rounded-lg border border-slate-850 font-mono text-emerald-400 leading-relaxed overflow-x-auto select-all max-h-36">
                  {selectedLog.responseSummary || '{ "status": "no data logged" }'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
