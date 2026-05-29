import React, { useState, useMemo } from 'react';
import { SmsUser, RechargeRequest, SystemConfig, SmsLog } from '../types';
import { UserPlus, Coins, QrCode, Trash2, Check, X, Search, Sparkles, Sliders, DollarSign, ArrowUpRight, ShieldAlert, Download, Database } from 'lucide-react';

interface AdminPanelProps {
  users: SmsUser[];
  currentUser: SmsUser;
  rechargeRequests: RechargeRequest[];
  systemConfig: SystemConfig;
  logs: SmsLog[];
  onUpdateUsers: (users: SmsUser[]) => void;
  onUpdateSystemConfig: (cfg: SystemConfig) => void;
  onUpdateRechargeRequests: (reqs: RechargeRequest[]) => void;
}

export default function AdminPanel({
  users,
  currentUser,
  rechargeRequests,
  systemConfig,
  logs,
  onUpdateUsers,
  onUpdateSystemConfig,
  onUpdateRechargeRequests
}: AdminPanelProps) {
  // Tabs inside Admin Panel
  const [adminTab, setAdminTab] = useState<'users' | 'recharge' | 'rates' | 'logsExport'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [logsSearchTerm, setLogsSearchTerm] = useState('');

  // Form for creating user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserBalance, setNewUserBalance] = useState('10.0');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Editable states for direct config settings
  const [smsCostInput, setSmsCostInput] = useState(systemConfig.smsCostPerPart.toString());
  const [usdtAddress, setUsdtAddress] = useState(systemConfig.usdtWalletAddress);
  const [btcAddress, setBtcAddress] = useState(systemConfig.btcWalletAddress);
  const [upiIdInput, setUpiIdInput] = useState(systemConfig.upiId);
  const [customQrImage, setCustomQrImage] = useState(systemConfig.qrCodeBase64 || '');
  const [rechargeCommissionInput, setRechargeCommissionInput] = useState((systemConfig.rechargeCommissionPercent ?? 15).toString());
  const [simulatedSuccess, setSimulatedSuccess] = useState(!!systemConfig.simulatedSuccessMode);

  // Directly adjust selected user balance
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBalanceVal, setEditBalanceVal] = useState('');

  // Handle direct custom QR Upload (base64 representation)
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomQrImage(base64);
        onUpdateSystemConfig({
          ...systemConfig,
          qrCodeBase64: base64
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setFormError('Please fill in Name and Email/ID.');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase().trim())) {
      setFormError('User with this email/ID already exists.');
      return;
    }

    const newUser: SmsUser = {
      id: `usr_${Math.random().toString(36).substring(3, 11)}_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword.trim() || '123456',
      balance: parseFloat(newUserBalance) || 0.0,
      role: newUserRole,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    onUpdateUsers([...users, newUser]);
    setFormSuccess(`User "${newUserName}" created successfully! Default PW is: ${newUserPassword || '123456'}`);
    
    // Clear fields
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserBalance('10.0');
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert("You cannot delete yourself (active Admin).");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user? This removes all active balance records associated with them.")) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleUpdateBalance = (userId: string) => {
    const numeric = parseFloat(editBalanceVal);
    if (isNaN(numeric)) {
      alert("Please specify a valid numeric balance.");
      return;
    }

    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, balance: numeric };
      }
      return u;
    });

    onUpdateUsers(updated);
    setEditingUserId(null);
  };

  const handleApproveRecharge = (req: RechargeRequest) => {
    // 1. Mark request as approved
    const updatedRequests = rechargeRequests.map(r => {
      if (r.id === req.id) {
        return { ...r, status: 'approved' as const, resolvedAt: new Date().toISOString() };
      }
      return r;
    });
    onUpdateRechargeRequests(updatedRequests);

    // 2. Add requested amount LESS 15% (or configured commission) directly to user
    const commPercent = systemConfig.rechargeCommissionPercent ?? 15;
    const creditedAmount = req.amount * (1 - commPercent / 100);

    const updatedUsers = users.map(u => {
      if (u.id === req.userId) {
        return { ...u, balance: u.balance + creditedAmount };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
  };

  const handleRejectRecharge = (req: RechargeRequest) => {
    const updatedRequests = rechargeRequests.map(r => {
      if (r.id === req.id) {
        return { ...r, status: 'rejected' as const, resolvedAt: new Date().toISOString() };
      }
      return r;
    });
    onUpdateRechargeRequests(updatedRequests);
  };

  const handleSaveRatesAndWallets = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(smsCostInput);
    if (isNaN(rate) || rate < 0) {
      alert("SMS Cost rate must be a positive number.");
      return;
    }

    const commissionPercent = parseFloat(rechargeCommissionInput);
    if (isNaN(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
      alert("Recharge commission percentage must be a valid number between 0 and 100.");
      return;
    }

    const newConfig: SystemConfig = {
      smsCostPerPart: rate,
      usdtWalletAddress: usdtAddress.trim(),
      btcWalletAddress: btcAddress.trim(),
      upiId: upiIdInput.trim(),
      qrCodeBase64: customQrImage,
      rechargeCommissionPercent: commissionPercent,
      simulatedSuccessMode: simulatedSuccess
    };

    onUpdateSystemConfig(newConfig);
    alert(`System settings updated successfully! Simulated Success Bypass Mode is now set to ${simulatedSuccess ? 'ON (Simulated profit bypass)' : 'OFF (Live gateway delivery)'}.`);
  };

  // Filter users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = rechargeRequests.filter(r => r.status === 'pending');
  const pastRequests = rechargeRequests.filter(r => r.status !== 'pending');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar navigation internal tabs inside Admin Panel */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-1.5 self-start shadow-xs">
        <div className="px-3 py-2 border-b border-slate-100 mb-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Administration</h4>
          <p className="text-[11px] text-slate-600 mt-1 font-bold">Shortcuts & Control Hub</p>
        </div>

        <button
          onClick={() => setAdminTab('users')}
          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded flex items-center gap-2.5 transition-colors cursor-pointer ${
            adminTab === 'users'
              ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
          }`}
        >
          <UserPlus size={13} />
          Create & Manage Users
          <span className="ml-auto text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">{users.length}</span>
        </button>

        <button
          onClick={() => setAdminTab('recharge')}
          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded flex items-center gap-2.5 transition-colors cursor-pointer ${
            adminTab === 'recharge'
              ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
          }`}
        >
          <Coins size={13} />
          Payment Recharges Queue
          {pendingRequests.length > 0 && (
            <span className="ml-auto text-[9px] bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('rates')}
          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded flex items-center gap-2.5 transition-colors cursor-pointer ${
            adminTab === 'rates'
              ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
          }`}
        >
          <Sliders size={13} />
          SMS Costs & QR Configs
        </button>

        <button
          onClick={() => setAdminTab('logsExport')}
          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded flex items-center gap-2.5 transition-colors cursor-pointer ${
            adminTab === 'logsExport'
              ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
          }`}
        >
          <Database size={13} />
          Bulk Logs CSV Export
          <span className="ml-auto text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">{logs.length}</span>
        </button>

        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-sm text-[10px] text-slate-500 space-y-2">
          <p className="font-bold text-slate-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Active Session
          </p>
          <p>Login ID: <span className="font-mono text-slate-700 font-semibold">{currentUser.email}</span></p>
          <p>Role Authority: <span className="text-emerald-700 font-bold uppercase">ADMINISTRATOR</span></p>
        </div>
      </div>

      {/* Main administrative screen space */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* TAB 1: USERS MANAGEMENT */}
        {adminTab === 'users' && (
          <div className="space-y-6">
            {/* Quick Creation Form */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <UserPlus size={15} className="text-indigo-600" /> Create New Client Account
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">Provision a new SMS user account with a customized default balance and access credentials below.</p>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Client Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">User Access Email / Login ID</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. ramesh@gmail.com"
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Access Password</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Leave empty for default '123456'"
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Initial Credits</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newUserBalance}
                      onChange={(e) => setNewUserBalance(e.target.value)}
                      placeholder="10.0"
                      className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Authority Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:focus:border-indigo-500"
                    >
                      <option value="user">Standard Client User</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </div>

                {formError && <div className="md:col-span-2 text-[11px] text-red-600 bg-red-50 border border-red-100 p-2 rounded">{formError}</div>}
                {formSuccess && <div className="md:col-span-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded">{formSuccess}</div>}

                <div className="md:col-span-2 flex justify-end mt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-4 rounded shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Add User to Registry
                  </button>
                </div>
              </form>
            </div>

            {/* List and Search Users */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    Registered Client Accounts List
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">Directly adjust client credits/balance, view current credentials, or delete records.</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                  <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users or roles..."
                    className="w-full text-[11px] pl-8 pr-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-2.5">Name/Email</th>
                      <th className="p-2.5">Created At</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5 text-right w-44">Credits Balance</th>
                      <th className="p-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          No users found matching "{searchTerm}"
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="border-b border-slate-150 hover:bg-slate-50 transition-colors">
                          <td className="p-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-extrabold">
                                {user.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900">{user.name}</span>
                                <span className="font-mono text-[9px] text-slate-400">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono text-[9px] text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-2.5">
                            <span className={`text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded uppercase ${
                              user.role === 'admin' 
                                ? 'bg-indigo-900 text-indigo-50 border border-indigo-750' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-semibold">
                            {editingUserId === user.id ? (
                              <div className="flex items-center gap-1 justify-end">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editBalanceVal}
                                  onChange={(e) => setEditBalanceVal(e.target.value)}
                                  className="w-20 text-[11px] font-mono p-0.5 border border-indigo-400 rounded outline-none text-right font-bold"
                                />
                                <button
                                  onClick={() => handleUpdateBalance(user.id)}
                                  className="bg-emerald-600 text-white p-0.5 rounded hover:bg-emerald-700 cursor-pointer"
                                  title="Save Balance"
                                >
                                  <Check size={11} />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="bg-slate-200 text-slate-600 p-0.5 rounded hover:bg-slate-300 cursor-pointer"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="font-mono text-xs text-indigo-700 font-extrabold">${user.balance.toFixed(2)} USD</span>
                                <button
                                  onClick={() => {
                                    setEditingUserId(user.id);
                                    setEditBalanceVal(user.balance.toFixed(2));
                                  }}
                                  className="text-[9px] text-indigo-600 hover:bg-indigo-50 border border-indigo-200 px-1 py-0.5 rounded cursor-pointer transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              disabled={user.id === currentUser.id}
                              onClick={() => handleDeleteUser(user.id)}
                              className={`p-1 text-slate-400 hover:text-red-500 rounded transition-colors ${
                                user.id === currentUser.id ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                              title={user.id === currentUser.id ? "Cannot delete yourself" : "Delete account"}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INCOMING RECHARGE REQUESTS */}
        {adminTab === 'recharge' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins size={15} className="text-indigo-600" /> Pending Payment Recharges Pipeline
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Review user deposit submissions, check transaction Hash proofs, and approve to credit user account instantaneously.</p>
              </div>

              {/* Pending Requests */}
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-sm">
                    No active pending payment recharge requests found.
                  </div>
                ) : (
                  pendingRequests.map(req => (
                    <div key={req.id} className="border border-indigo-150 bg-indigo-50/20 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">{req.userName}</span>
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded">User ID: {req.userId.substring(4, 10)}...</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Deposit Amt: <strong className="text-slate-800 font-extrabold">${req.amount.toFixed(2)} USD</strong></span>
                          <span>Commission Deduct ({(systemConfig.rechargeCommissionPercent ?? 15)}%): <strong className="text-rose-600 font-bold">-${(req.amount * (systemConfig.rechargeCommissionPercent ?? 15) / 100).toFixed(2)} USD</strong></span>
                          <span>Net Credited: <strong className="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">${(req.amount * (1 - (systemConfig.rechargeCommissionPercent ?? 15) / 100)).toFixed(2)} USD</strong></span>
                          <span>Wallet Sent: <strong className="text-slate-700 font-bold">{req.walletAddress}</strong></span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-3 bg-slate-100/80 max-w-xl p-1.5 rounded border border-slate-200 mt-1">
                          <span className="font-bold text-slate-600">TX Hash/Proof:</span>
                          <span className="font-mono text-indigo-900 select-all font-semibold break-all">{req.transactionHash}</span>
                        </div>
                        {req.imageProof && (
                          <div className="mt-2">
                            <span className="text-[9px] text-slate-400 block mb-1">Uploaded receipt screenshot:</span>
                            <img 
                              src={req.imageProof} 
                              alt="Transaction receipt proof" 
                              className="max-h-24 max-w-xs border border-slate-300 rounded object-contain bg-slate-100"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => handleRejectRecharge(req)}
                          className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <X size={12} /> Decline
                        </button>
                        <button
                          onClick={() => handleApproveRecharge(req)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded shadow-xs hover:shadow transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check size={12} /> Approve Deposit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Past Recharge Logs */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest leading-none">
                  Resolved Recharge History Ledger
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5">Historical sequence of all resolved, approved and rejected user deposit notifications.</p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-2">User</th>
                      <th className="p-2">Time Submitted</th>
                      <th className="p-2">Amount claimed</th>
                      <th className="p-2">Proof hash</th>
                      <th className="p-2 text-center">Outcome Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No historical recharge records yet.
                        </td>
                      </tr>
                    ) : (
                      pastRequests.map(req => (
                        <tr key={req.id} className="border-b border-slate-150 hover:bg-slate-50 transition-colors">
                          <td className="p-2 font-bold text-slate-800">{req.userName}</td>
                          <td className="p-2 text-[10px] font-mono text-slate-500">{new Date(req.createdAt).toLocaleString()}</td>
                          <td className="p-2 font-mono">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">${req.amount.toFixed(2)} USD</span>
                              {req.status === 'approved' && (
                                <span className="text-[9px] text-emerald-600 font-semibold">Net: ${(req.amount * (1 - (systemConfig.rechargeCommissionPercent ?? 15) / 100)).toFixed(2)} USD</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-[9px] font-mono text-slate-400 max-w-xs truncate" title={req.transactionHash}>{req.transactionHash}</td>
                          <td className="p-2 text-center">
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COST PARAMETERS & RECHARGE COORDINATES CONFIGS */}
        {adminTab === 'rates' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveRatesAndWallets} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Sliders size={15} className="text-indigo-600" /> Cost Configurations & Wallet Coordinates
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Specify global costs deducted when sending SMS, and enter cryptocurrency addresses or UPI contacts shown to users for recharges.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    SMS Cost Per Dynamic Segment Part <span className="text-red-500">*</span>
                  </label>
                  <div className="relative max-w-xs">
                    <DollarSign size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={smsCostInput}
                      onChange={(e) => setSmsCostInput(e.target.value)}
                      placeholder="e.g. 0.15"
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono font-bold text-indigo-700"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 leading-normal">
                    This numeric amount (credits/dollars) is programmatically subtracted from standard users' balance for <strong>every dynamic 150-character segment part dispatch</strong> made via the platform.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    System Recharge Deposit Commission Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">%</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={rechargeCommissionInput}
                      onChange={(e) => setRechargeCommissionInput(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono font-bold text-indigo-700"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 leading-normal">
                    This percentage fee commission (e.g. 15%) is automatically deducted by the portal whenever client deposits are approved. If they submit $100.00, they are credited with $85.00.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2 p-4 bg-amber-50/60 border border-amber-200 rounded-lg">
                  <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-600 animate-pulse" />
                    Simulated Direct Success Toggle (Admin Profit Mode)
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="checkbox"
                      id="simulated-success-checkbox"
                      checked={simulatedSuccess}
                      onChange={(e) => setSimulatedSuccess(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="simulated-success-checkbox" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                      Activate Silent Simulator Bypass (Bypass Live Sending, Force Successful Reports)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-600 leading-normal mt-1">
                    When <strong>ON</strong>, the platform bypasses the actual gateway sending request completely. Users will still experience realistic sending latency, their credit balance will be <strong>fully deducted</strong>, and their dynamic broadcast logs will be marked as <strong>Delivered</strong> successfully. This minimizes your API expenses and maximizes <strong>pure admin profit</strong> instantly.
                  </span>
                </div>

                <div className="h-px bg-slate-200 md:col-span-2 my-1"></div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">USDT Wallet Address (TRC20)</label>
                  <input
                    type="text"
                    value={usdtAddress}
                    onChange={(e) => setUsdtAddress(e.target.value)}
                    placeholder="USDT Tron/TRC20 Public key address"
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="text-[9px] text-slate-400">Tether deposits TRC-20 protocol network.</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Bitcoin (BTC) Wallet Address</label>
                  <input
                    type="text"
                    value={btcAddress}
                    onChange={(e) => setBtcAddress(e.target.value)}
                    placeholder="Bitcoin wallet public address"
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="text-[9px] text-slate-400">Native BTC protocol address.</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">UPI Identifier / VPA Address</label>
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="e.g. companyname@okaxis"
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="text-[9px] text-slate-400">For direct Bank API UPI QR transfers (INR).</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">System Uploaded Recharge QR image</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      id="qr-blueprint-uploader"
                      className="hidden"
                    />
                    <label 
                      htmlFor="qr-blueprint-uploader" 
                      className="cursor-pointer text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded transition-colors"
                    >
                      Choose QR File
                    </label>
                    {customQrImage && (
                      <button
                        type="button"
                        onClick={() => { setCustomQrImage(''); }}
                        className="text-[9px] text-red-500 hover:underline cursor-pointer"
                      >
                        Reset QR code
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400">Recommended context QR PNG/JPG invoice formats.</span>
                </div>

                <div className="md:col-span-2 bg-slate-50 rounded p-3 border border-slate-200 flex items-start gap-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-white border border-slate-200 rounded flex items-center justify-center p-1">
                    {customQrImage ? (
                      <img src={customQrImage} alt="QR Code Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <QrCode className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 uppercase block">Active Payment QR Code</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      {customQrImage ? "Your custom QR code has been base64 encoded and is fully configured for users." : "No custom merchant QR has been supplied. A dynamic visual placeholder scan card will be automatically presented to standard clients."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 px-6 rounded shadow-xs hover:shadow transition-colors cursor-pointer"
                >
                  Save Cost Configurations
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: BULK LOGS CSV EXPORT */}
        {adminTab === 'logsExport' && (() => {
          // Inner useMemo/computation
          const filteredLogsForExport = logs.filter(log => {
            if (!logsSearchTerm.trim()) return true;
            const q = logsSearchTerm.toLowerCase();
            return (
              log.phone.includes(q) ||
              (log.name && log.name.toLowerCase().includes(q)) ||
              log.content.toLowerCase().includes(q) ||
              (log.userName && log.userName.toLowerCase().includes(q)) ||
              (log.userId && log.userId.toLowerCase().includes(q))
            );
          });

          const handleExportLogsCsv = () => {
            if (filteredLogsForExport.length === 0) {
              alert("No active dispatch logs found to export.");
              return;
            }

            // CSV Columns headers
            const headers = ["Dispatch ID", "Timestamp", "Recipient Phone", "Recipient Name", "Message Text", "Delivery Status", "Dynamic Segments Count", "Gateway Engine", "Sender Account ID", "Sender User Name", "Provider Response"];
            
            // Construct lines
            const csvRows = [headers.join(",")];
            
            filteredLogsForExport.forEach(log => {
              const row = [
                `"${log.id}"`,
                `"${new Date(log.timestamp).toLocaleString()}"`,
                `"${log.phone}"`,
                `"${(log.name || 'Anonymous').replace(/"/g, '""')}"`,
                `"${log.content.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
                `"${log.status}"`,
                log.chunksCount,
                `"${log.gatewayName}"`,
                `"${log.userId || 'usr_admin'}"`,
                `"${(log.userName || 'Master Admin').replace(/"/g, '""')}"`,
                `"${(log.responseSummary || '').replace(/"/g, '""')}"`
              ];
              csvRows.push(row.join(","));
            });
            
            const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `ultra_sender_all_users_dispatches_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          return (
            <div id="logs-export-portal" className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={15} className="text-indigo-600 animate-pulse" /> All Users Outbound Logs master ledger
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">Monitor all sent SMS dispatches from all accounts, filter with search constraints, and dump to standard CSV format.</p>
                </div>

                <button
                  type="button"
                  onClick={handleExportLogsCsv}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-lg flex items-center gap-2 shadow-xs hover:shadow transition-colors cursor-pointer"
                >
                  <Download size={14} /> Download Filtered CSV Dump
                </button>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total Dispatches</span>
                  <strong className="text-lg text-slate-800 font-mono">{logs.length} SMS</strong>
                </div>
                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                  <span className="text-[9px] text-indigo-700 font-bold block uppercase tracking-wider">Filtered Matches</span>
                  <strong className="text-lg text-indigo-800 font-mono">{filteredLogsForExport.length} lines</strong>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                  <span className="text-[9px] text-emerald-700 font-bold block uppercase tracking-wider">Delivered Success</span>
                  <strong className="text-lg text-emerald-800 font-mono">
                    {filteredLogsForExport.filter(l => l.status === 'delivered').length} SMS
                  </strong>
                </div>
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100/50">
                  <span className="text-[9px] text-rose-700 font-bold block uppercase tracking-wider">Failed Segments</span>
                  <strong className="text-lg text-rose-800 font-mono">
                    {filteredLogsForExport.filter(l => l.status === 'failed').length} units
                  </strong>
                </div>
              </div>

              {/* Search & Inputs */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={logsSearchTerm}
                  onChange={(e) => setLogsSearchTerm(e.target.value)}
                  placeholder="Filter by sender name, recipient number, keywords inside SMS body, or delivery outcome..."
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 font-mono font-medium"
                />
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto border border-slate-200 rounded max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white">
                      <th className="p-2">Sender User</th>
                      <th className="p-2">Recipient Phone</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2">Message Body</th>
                      <th className="p-2 ring-1 ring-slate-100 text-center">Parts</th>
                      <th className="p-2">Dispatched Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogsForExport.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-450 italic">
                          No logging tracks match your search queries.
                        </td>
                      </tr>
                    ) : (
                      filteredLogsForExport.map(log => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-indigo-900">{log.userName || 'System Admin'}</span>
                              <span className="text-[9px] font-mono text-slate-400">{log.userId || 'usr_admin'}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800">{log.name || 'Anonymous'}</span>
                              <span className="font-mono text-[10px] text-slate-500">{log.phone}</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              log.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                              log.status === 'sent' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                              log.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-150' :
                              'bg-rose-50 text-rose-800 border border-rose-100'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-2 max-w-sm font-sans text-stone-600 truncate text-[11px]" title={log.content}>
                            {log.content}
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-slate-800">{log.chunksCount} Parts</td>
                          <td className="p-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
