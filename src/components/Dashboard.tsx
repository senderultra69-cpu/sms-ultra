import React, { useMemo, useState } from 'react';
import { SmsLog, SmsMetrics, SmsUser, RechargeRequest, SystemConfig } from '../types';
import { Send, CheckCircle2, AlertTriangle, Clock, Coins, Flame, ArrowRight, BarChart3, Copy, Check, Upload, ArrowUpRight, ShieldAlert, Sparkles, CreditCard, Landmark, Sliders } from 'lucide-react';

interface DashboardProps {
  logs: SmsLog[];
  metrics: SmsMetrics;
  users: SmsUser[];
  currentUser: SmsUser;
  systemConfig: SystemConfig;
  rechargeRequests: RechargeRequest[];
  onNavigate: (tab: 'send' | 'contacts' | 'templates' | 'logs' | 'settings' | 'admin') => void;
  onUpdateRechargeRequests: (reqs: RechargeRequest[]) => void;
}

export default function Dashboard({
  logs,
  metrics,
  users,
  currentUser,
  systemConfig,
  rechargeRequests,
  onNavigate,
  onUpdateRechargeRequests
}: DashboardProps) {
  // Compute recent stats
  const activeLogs = useMemo(() => {
    return logs.slice(0, 5);
  }, [logs]);

  // States for copy buttons
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Recharge form states
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'usdt' | 'btc' | 'upi'>('usdt');
  const [txHash, setTxHash] = useState('');
  const [uploadedReceipt, setUploadedReceipt] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState('');
  const [rechargeError, setRechargeError] = useState('');

  // Handle receipt screenshot simulation
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedReceipt(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSubmitRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeSuccess('');
    setRechargeError('');

    const parsedAmt = parseFloat(rechargeAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setRechargeError('Please specify a positive numeric deposit amount.');
      return;
    }

    if (!txHash.trim()) {
      setRechargeError('Please enter a Transaction hash, UPI Ref or payment reference proof description.');
      return;
    }

    const modeLabels = {
      usdt: 'USDT (TRC20)',
      btc: 'Bitcoin (BTC)',
      upi: 'UPI VPA Direct'
    };

    const newRequest: RechargeRequest = {
      id: `req_${Math.random().toString(36).substring(3, 11)}_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount: parsedAmt,
      walletAddress: `${modeLabels[paymentMode]}: ${
        paymentMode === 'usdt' ? systemConfig.usdtWalletAddress :
        paymentMode === 'btc' ? systemConfig.btcWalletAddress :
        systemConfig.upiId
      }`,
      transactionHash: txHash.trim(),
      imageProof: uploadedReceipt || undefined,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onUpdateRechargeRequests([newRequest, ...rechargeRequests]);
    setRechargeSuccess(`Your recharge claim of $${parsedAmt.toFixed(2)} USD with Tx proof has been submitted to the Admin portal queue for instantaneous checking & validation!`);
    
    // reset form
    setRechargeAmount('');
    setTxHash('');
    setUploadedReceipt('');
  };

  // User's recharge requests list
  const userRequests = useMemo(() => {
    return rechargeRequests.filter(r => r.userId === currentUser.id);
  }, [rechargeRequests, currentUser.id]);

  // Generate 7-day chart data dynamically based on real logs
  const chartData = useMemo(() => {
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    // Map logs inside these dates
    const dataMap: Record<string, { sent: number; failed: number }> = {};
    dates.forEach(date => {
      dataMap[date] = { sent: 0, failed: 0 };
    });

    logs.forEach(log => {
      const logDate = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dataMap[logDate]) {
        if (log.status === 'failed') {
          dataMap[logDate].failed += 1;
        } else {
          dataMap[logDate].sent += 1;
        }
      }
    });

    return dates.map(date => ({
      date,
      sent: dataMap[date].sent,
      failed: dataMap[date].failed,
      total: dataMap[date].sent + dataMap[date].failed
    }));
  }, [logs]);

  // Max value for SVG scaling
  const maxVal = useMemo(() => {
    const values = chartData.map(d => d.total);
    const max = Math.max(...values);
    return max <= 0 ? 10 : Math.ceil(max * 1.2);
  }, [chartData]);

  // Generate SVG path coordinates
  const svgPath = useMemo(() => {
    if (chartData.length === 0) return null;
    const width = 500;
    const height = 150;
    const paddingX = 30;
    const paddingY = 20;

    const points = chartData.map((d, index) => {
      const x = paddingX + (index * (width - paddingX * 2)) / (chartData.length - 1);
      const ratio = d.total / maxVal;
      const y = height - paddingY - ratio * (height - paddingY * 2);
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    const fillPath = `${path} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return { stroke: path, fill: fillPath, points };
  }, [chartData, maxVal]);

  return (
    <div id="sms-dashboard" className="space-y-6">
      
      {/* Admin Alert Notification */}
      {currentUser.role === 'admin' && rechargeRequests.some(r => r.status === 'pending') && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></span>
            <span>You have <strong>{rechargeRequests.filter(r => r.status === 'pending').length} pending payment recharge requests</strong> waiting to be reviewed & verified.</span>
          </div>
          <button 
            onClick={() => onNavigate('admin')}
            className="text-xs bg-orange-600 font-extrabold hover:bg-orange-700 text-white px-3 py-1 rounded shadow-xs"
          >
            Review Claims Now
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Dispatched */}
        <div id="stat-dispatched" className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-450 uppercase tracking-wider mb-1">Total Send</p>
            <h3 className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{metrics.totalSent}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Send size={18} />
          </div>
        </div>

        {/* Delivered Box */}
        <div id="stat-delivered" className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-450 uppercase tracking-wider mb-1">Delivered</p>
            <h3 className="text-3xl font-bold text-emerald-600 tabular-nums leading-none">
              {metrics.totalDelivered}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({metrics.totalSent > 0 ? Math.round((metrics.totalDelivered / metrics.totalSent) * 105) / 1.05 : 0}%)
              </span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Failed Box */}
        <div id="stat-failed" className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-450 uppercase tracking-wider mb-1">Failed</p>
            <h3 className="text-3xl font-bold text-rose-600 tabular-nums leading-none">{metrics.totalFailed}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle size={18} />
          </div>
        </div>

        {/* Queue / Cost Rate Box */}
        <div id="stat-pending" className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-450 uppercase tracking-wider mb-1">SMS Cost Rate</p>
            <h3 className="text-xl font-black text-indigo-700 tabular-nums leading-none mt-1">
              ${systemConfig.smsCostPerPart} <span className="text-[10px] font-normal text-slate-500 font-sans">/part</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-750">
            <Coins size={18} />
          </div>
        </div>

        {/* Available Credits Box */}
        <div id="stat-credits" className="bg-white p-5 rounded-xl border border-indigo-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Internal Balance</p>
            <h3 className="text-2xl font-black text-indigo-700 tabular-nums leading-none">
              ${currentUser.balance.toFixed(2)}
              <span className="text-[10px] font-semibold text-slate-450 ml-1"> USD</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Coins size={18} className="animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>
      </div>

      {/* Grid Layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main analytical trend chart */}
        <div id="trend-chart-panel" className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Dispatched Metrics (Last 7 Days)</h4>
              <p className="text-xs text-slate-400">Chronological history mapping of outgoing SMS requests</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Outgoing Total
              </span>
            </div>
          </div>

          <div className="relative pt-4">
            {/* Custom Interactive SVG Line Plot */}
            <svg viewBox="0 0 500 150" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="30" y1="20" x2="470" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="65" x2="470" y2="65" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="110" x2="470" y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="130" x2="470" y2="130" stroke="#f1f5f9" strokeWidth="1" />

              {/* Grid values */}
              <text x="22" y="24" textAnchor="end" className="text-[9px] fill-slate-300 font-mono tabular-nums">{maxVal}</text>
              <text x="22" y="69" textAnchor="end" className="text-[9px] fill-slate-300 font-mono tabular-nums">{Math.round(maxVal / 2)}</text>
              <text x="22" y="134" textAnchor="end" className="text-[9px] fill-slate-300 font-mono tabular-nums">0</text>

              {svgPath && (
                <>
                  <path d={svgPath.fill} fill="url(#chartGradient)" />
                  <path d={svgPath.stroke} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
                  {svgPath.points.map((pt, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                      <circle cx={pt.x} cy={pt.y} r="8" fill="#4f46e5" fillOpacity="0.1" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </g>
                  ))}
                </>
              )}

              {/* X Axis Labels */}
              {chartData.map((d, i) => {
                const x = 30 + (i * 440) / (chartData.length - 1);
                return (
                  <text key={i} x={x} y="146" textAnchor="middle" className="text-[8px] fill-slate-400 font-medium">
                    {d.date}
                  </text>
                );
              })}
            </svg>
          </div>
          
          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><BarChart3 size={13} className="text-indigo-500" /> Segment costs: {systemConfig.smsCostPerPart} credit-units per 150 characters sent.</span>
            <button onClick={() => onNavigate('logs')} className="text-indigo-600 font-medium hover:underline flex items-center gap-0.5 whitespace-nowrap">Explore logs <ArrowRight size={12} /></button>
          </div>
        </div>

        {/* Sidebar right pane: Quick actions */}
        <div id="quick-action-panel" className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">EIMS Action Console</h4>
            <p className="text-xs text-slate-400">Direct shortcuts to dispatch tasks or configure adapters</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
               id="action-write-sms"
              onClick={() => onNavigate('send')}
              className="group w-full p-2.5 text-left border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/40 rounded flex items-center gap-3 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100/70 transition-colors">
                <Send size={15} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700">Shortcut SMS dispatch</p>
                <p className="text-[10px] text-slate-400">Write custom texts, batch upload, or expand templates</p>
              </div>
            </button>

            {currentUser.role === 'admin' ? (
              <button
                id="action-settings-panel"
                onClick={() => onNavigate('settings')}
                className="group w-full p-2.5 text-left border border-slate-100 hover:border-violet-100 hover:bg-violet-50/40 rounded flex items-center gap-3 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-100/70 transition-colors">
                  <Sliders size={15} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700">Gateway configurations</p>
                  <p className="text-[10px] text-slate-400">Manage URLs, set Twilio API, link HTTP shortcuts</p>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  const el = document.getElementById('recharge-billing-portal');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group w-full p-2.5 text-left border border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/50 rounded flex items-center gap-3 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center">
                  <Coins size={15} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-indigo-700">Add Account Balance</p>
                  <p className="text-[10px] text-indigo-500">Initiate a QR payment recharge claim instantly</p>
                </div>
              </button>
            )}
          </div>

          {/* Quick Realtime Active Activity logs header */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Dispatches</h5>
            {activeLogs.length === 0 ? (
              <div className="text-center py-4 bg-slate-50/50 rounded border border-dashed border-slate-100">
                <p className="text-xs text-slate-400">No outbound records logged yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {activeLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded text-xs border border-transparent hover:border-slate-100 transition-all">
                    <div className="truncate flex-1 pr-2">
                      <p className="font-semibold text-slate-700 truncate">{log.phone}</p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">{log.content}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                        log.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        log.status === 'sent' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        log.status === 'pending' ? 'bg-amber-50 text-amber-500 border border-amber-100' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECHARGE & DEPOSIT BILLING PORTAL WIDGET (STUNNING COMPACT GRID) */}
      <div id="recharge-billing-portal" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left pane: Recharge Guidelines & QR Codes configured by Admin */}
        <div className="space-y-4">
          <div>
            <span className="text-[10px] text-indigo-600 font-extrabold tracking-wider uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">Recharge Center</span>
            <h3 className="font-black text-slate-900 text-base mt-2 flex items-center gap-1.5">
              <Sparkles size={16} className="text-indigo-600 animate-pulse" /> Merchant QR / Wallet Deposit
            </h3>
            <p className="text-xs text-slate-500">Scan standard QR below or copy our USDT/BTC wallets coordinates to make instant transfers. Submit your claim receipt on the right.</p>
          </div>

          {/* Active QR scanner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center max-w-[240px] mx-auto lg:mx-0">
            {systemConfig.qrCodeBase64 ? (
              <img 
                src={systemConfig.qrCodeBase64} 
                className="w-40 h-40 object-contain bg-white border border-slate-200 rounded p-1 mb-2 shadow-xs" 
                alt="Merchant Deposit QR Code"
                referrerPolicy="no-referrer"
              />
            ) : (
              // dynamic beautiful SVG QR code fallback representator
              <div className="w-40 h-40 bg-white border-2 border-slate-200 rounded mb-2 flex flex-col items-center justify-center p-2 text-center text-[10px] font-mono leading-none relative shadow-xs overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50 flex flex-col items-center justify-center p-3 text-center">
                  <div className="grid grid-cols-4 gap-1 transform rotate-45 scale-75">
                    <div className="w-6 h-6 bg-slate-800 rounded-xs"></div>
                    <div className="w-6 h-6 bg-transparent border-2 border-slate-800"></div>
                    <div className="w-6 h-6 bg-slate-800"></div>
                    <div className="w-6 h-6 bg-slate-800"></div>
                    <div className="w-6 h-6 bg-slate-800"></div>
                    <div className="w-6 h-6 bg-slate-800"></div>
                    <div className="w-6 h-6 bg-transparent"></div>
                    <div className="w-6 h-6 bg-slate-800"></div>
                  </div>
                  <span className="font-bold text-slate-800 text-[9px] mt-4 uppercase tracking-tight">ULTRA SENDER QR</span>
                  <span className="text-[8px] text-slate-450 mt-1">Scan to pay merchant</span>
                </div>
              </div>
            )}
            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-widest text-center">Scan to Pay Account</span>
          </div>

          {/* Rate Warning */}
          <div className="bg-slate-50 border border-slate-150 p-3 rounded text-[11px] text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-900 flex items-center gap-1">
              <ShieldAlert size={12} className="text-indigo-600" /> Platform Billing Rules
            </p>
            <p className="leading-normal">Recharges are audited manually in less than 15 minutes by supervisors. Make sure you input the exact transaction HASH reference code below or upload screenshot proofs.</p>
          </div>
        </div>

        {/* Center pane: Wallet Directories */}
        <div className="space-y-4 lg:border-l lg:border-r lg:border-slate-100 lg:px-6">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Active Wallet Addresses</h4>
          
          <div className="space-y-3">
            {/* USDT Card */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>Tether Tron (USDT TRC20)</span>
                {copiedKey === 'usdt' && <span className="text-indigo-600 text-[9px] lowercase flex items-center"><Check size={8} className="mr-0.5" /> Copied</span>}
              </label>
              <div className="flex rounded border border-slate-200 overflow-hidden bg-slate-50 max-w-sm">
                <span className="p-1 px-2.5 bg-slate-100 border-r border-slate-200 text-[10px] font-semibold text-slate-500 font-mono">USDT</span>
                <input 
                  type="text" 
                  readOnly 
                  value={systemConfig.usdtWalletAddress} 
                  className="flex-1 p-1 px-2 text-[10px] font-mono text-slate-800 bg-transparent outline-none border-none select-all focus:ring-0" 
                />
                <button 
                  onClick={() => handleCopy(systemConfig.usdtWalletAddress, 'usdt')}
                  className="p-1 px-2 bg-white text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer border-l border-slate-200"
                  title="Copy TRC20 Public Key"
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>

            {/* BTC Card */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>Bitcoin BTC Wallet</span>
                {copiedKey === 'btc' && <span className="text-indigo-600 text-[9px] lowercase flex items-center"><Check size={8} className="mr-0.5" /> Copied</span>}
              </label>
              <div className="flex rounded border border-slate-200 overflow-hidden bg-slate-50 max-w-sm">
                <span className="p-1 px-2.5 bg-slate-100 border-r border-slate-200 text-[10px] font-semibold text-slate-500 font-mono">BTC</span>
                <input 
                  type="text" 
                  readOnly 
                  value={systemConfig.btcWalletAddress} 
                  className="flex-1 p-1 px-2 text-[10px] font-mono text-slate-800 bg-transparent outline-none border-none select-all focus:ring-0" 
                />
                <button 
                  onClick={() => handleCopy(systemConfig.btcWalletAddress, 'btc')}
                  className="p-1 px-2 bg-white text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer border-l border-slate-200"
                  title="Copy BTC Address"
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>

            {/* UPI ID Card */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>UPI Bank Address (INR Payments)</span>
                {copiedKey === 'upi' && <span className="text-indigo-600 text-[9px] lowercase flex items-center"><Check size={8} className="mr-0.5" /> Copied</span>}
              </label>
              <div className="flex rounded border border-slate-200 overflow-hidden bg-slate-50 max-w-sm">
                <span className="p-1 px-2.5 bg-slate-100 border-r border-slate-200 text-[10px] font-semibold text-slate-500 font-mono">UPI ID</span>
                <input 
                  type="text" 
                  readOnly 
                  value={systemConfig.upiId} 
                  className="flex-1 p-1 px-2 text-[10px] font-mono text-slate-800 bg-transparent outline-none border-none select-all focus:ring-0" 
                />
                <button 
                  onClick={() => handleCopy(systemConfig.upiId, 'upi')}
                  className="p-1 px-2 bg-white text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer border-l border-slate-200"
                  title="Copy UPI ID pointer"
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* User's Claim Requests list */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Recent recharge Request Claims</span>
            {userRequests.length === 0 ? (
              <span className="text-[10px] text-slate-400 block italic">You have not submitted deposit claims yet. After paying, write transaction hash codes on the right to notify administrators.</span>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {userRequests.map(req => (
                  <div key={req.id} className="text-[10.5px] border border-slate-200 rounded p-2 bg-slate-50 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-700">${req.amount.toFixed(2)} USD</span>
                        <span className="text-[9px] text-slate-400">
                          (Net: ${(req.amount * (1 - (systemConfig.rechargeCommissionPercent ?? 15) / 100)).toFixed(2)} USD)
                        </span>
                      </div>
                      <span className="block text-[8.5px] font-mono text-slate-400 truncate max-w-[130px]" title={req.transactionHash}>{req.transactionHash}</span>
                    </div>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Recharge form submission */}
        <form onSubmit={handleSubmitRecharge} className="space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <CreditCard size={14} className="text-indigo-600" /> Submit Recharge Deposit alert
          </h4>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-600 uppercase">Amount (USD/Credits)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 100.00"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-250 bg-slate-50 rounded focus:bg-white focus:border-indigo-500 outline-none font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-600 uppercase">Payment Mode</label>
                <select 
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="text-xs px-2.5 py-1.5 border border-slate-250 bg-slate-100 rounded focus:bg-white outline-none"
                >
                  <option value="usdt">USDT Tron (TRC20)</option>
                  <option value="btc">Bitcoin Network</option>
                  <option value="upi">Direct UPI UPI QR</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-600 uppercase">Transaction ID / UPI Reference Code</label>
              <input 
                type="text"
                required
                placeholder="Paste TRC20 Tx hash or UPI ref"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-250 bg-slate-50 rounded focus:bg-white focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-600 uppercase">Attach payment Receipt screenshot (optional)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleReceiptUpload} 
                  id="receipt-screenshot-selector"
                  className="hidden" 
                />
                <label 
                  htmlFor="receipt-screenshot-selector"
                  className="cursor-pointer text-[9px] bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded font-bold transition-colors select-none"
                >
                  Choose File
                </label>
                {uploadedReceipt && <span className="text-[9px] text-emerald-600 font-bold lowercase">Attached!</span>}
              </div>
            </div>

            {parseFloat(rechargeAmount) > 0 && (() => {
              const commPercent = systemConfig.rechargeCommissionPercent ?? 15;
              const rawValue = parseFloat(rechargeAmount) || 0;
              const cut = (rawValue * commPercent) / 100;
              const netValue = Math.max(0, rawValue - cut);
              return (
                <div id="live-recharge-calculator-block" className="bg-indigo-50/70 border border-indigo-100 rounded p-2.5 space-y-1 text-[11px] text-slate-700">
                  <div className="flex justify-between font-semibold">
                    <span>Requested Deposit:</span>
                    <span className="font-mono text-slate-900">${rawValue.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Commission Cut ({commPercent}%):</span>
                    <span className="font-mono text-rose-500">-${cut.toFixed(2)} USD</span>
                  </div>
                  <div className="border-t border-indigo-150 my-1"></div>
                  <div className="flex justify-between font-extrabold text-indigo-700 text-xs">
                    <span>Balance Received:</span>
                    <span className="font-mono">${netValue.toFixed(2)} USD</span>
                  </div>
                </div>
              );
            })()}

            {rechargeSuccess && <div className="text-[10.5px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded leading-normal">{rechargeSuccess}</div>}
            {rechargeError && <div className="text-[10.5px] text-red-600 bg-red-50 border border-red-100 p-2 rounded leading-normal">{rechargeError}</div>}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded shadow-xs text-center transition-all cursor-pointer"
            >
              Verify & Notify Administrator
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
