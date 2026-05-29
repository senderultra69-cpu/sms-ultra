import React, { useState } from 'react';
import { GatewayConfigState, Gateway, CustomHeader, CustomParam } from '../types';
import { Settings, Check, HelpCircle, Save, Plus, Trash2, HelpCircle as HelpIcon, ShieldAlert, KeyRound, Globe, ServerCrash } from 'lucide-react';

interface GatewaySettingsProps {
  gatewayConfig: GatewayConfigState;
  onUpdateGatewayConfig: (config: GatewayConfigState) => void;
}

export default function GatewaySettings({ gatewayConfig, onUpdateGatewayConfig }: GatewaySettingsProps) {
  const [activeId, setActiveId] = useState(gatewayConfig.activeId);
  const [gateways, setGateways] = useState<Gateway[]>(gatewayConfig.gateways);
  const [successMsg, setSuccessMsg] = useState('');

  // Find selected active gateway model
  const activeGateway = gateways.find(g => g.id === activeId) || gateways[0];

  // Handle active selection change
  const handleActiveToggle = (id: string) => {
    setActiveId(id);
    setSuccessMsg('');
  };

  // Generic settings field updater
  const updateGatewaySettingField = (gatewayId: string, field: string, value: any) => {
    setGateways(current =>
      current.map(g => {
        if (g.id === gatewayId) {
          return {
            ...g,
            settings: {
              ...g.settings,
              [field]: value
            }
          };
        }
        return g;
      })
    );
    setSuccessMsg('');
  };

  // Custom HTTP Headers manager helpers
  const handleAddHeader = (gatewayId: string) => {
    const target = gateways.find(g => g.id === gatewayId);
    if (target) {
      const headers = target.settings.headers || [];
      const updated = [...headers, { key: '', value: '' }];
      updateGatewaySettingField(gatewayId, 'headers', updated);
    }
  };

  const handleUpdateHeader = (gatewayId: string, index: number, key: string, value: string) => {
    const target = gateways.find(g => g.id === gatewayId);
    if (target) {
      const headers = [...(target.settings.headers || [])];
      headers[index] = { key, value };
      updateGatewaySettingField(gatewayId, 'headers', headers);
    }
  };

  const handleRemoveHeader = (gatewayId: string, index: number) => {
    const target = gateways.find(g => g.id === gatewayId);
    if (target) {
      const headers = [...(target.settings.headers || [])];
      headers.splice(index, 1);
      updateGatewaySettingField(gatewayId, 'headers', headers);
    }
  };

  // Custom HTTP Parameters manager helpers
  const handleAddParam = (gatewayId: string) => {
    const target = gateways.find(g => g.id === gatewayId);
    if (target) {
      const additionalParams = target.settings.additionalParams || [];
      const updated = [...additionalParams, { key: '', value: '' }];
      updateGatewaySettingField(gatewayId, 'additionalParams', updated);
    }
  };

  const handleUpdateParam = (gatewayId: string, index: number, key: string, value: string) => {
    const target = gateways.find(g => g.id === gatewayId);
    if (target) {
      const additionalParams = [...(target.settings.additionalParams || [])];
      additionalParams[index] = { key, value };
      updateGatewaySettingField(gatewayId, 'additionalParams', additionalParams);
    }
  };

  const handleRemoveParam = (gatewayId: string, index: number) => {
    const target = gateways.find(g => g.id === gatewayId);
    if (target) {
      const additionalParams = [...(target.settings.additionalParams || [])];
      additionalParams.splice(index, 1);
      updateGatewaySettingField(gatewayId, 'additionalParams', additionalParams);
    }
  };

  // Save changes to central App parent contexts
  const handleSaveConfigs = () => {
    onUpdateGatewayConfig({
      activeId,
      gateways
    });
    setSuccessMsg('Gateway configuration settings applied and updated successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div id="settings-management" className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <Settings size={18} className="text-indigo-500" /> Gateway Integration Manager
          </h4>
          <p className="text-xs text-slate-400">Specify API links and key credentials of target delivery pipelines</p>
        </div>

        {/* Global Active selection */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose outgoing active pipeline:</span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {gateways.map(g => (
              <div
                key={g.id}
                onClick={() => handleActiveToggle(g.id)}
                className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3.5 ${
                  activeId === g.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-600'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                  activeId === g.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                }`}>
                  {activeId === g.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                <div className="flex-1 mt-0.5">
                  <span className="text-xs font-bold font-sans block">{g.name}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 capitalize">{g.type} adapter channel</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Detail configurations editor based on selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs lg:col-span-8 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                Configure {activeGateway.name} Properties
              </h4>
              <p className="text-[11px] text-slate-400">Settings below will apply whenever this gateway is selected active</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold uppercase font-mono">
              Secure Proxy Enabled
            </span>
          </div>

          {/* Type MOCK Settings View */}
          {activeGateway.type === 'mock' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-55 rounded-xl border border-teal-100 flex items-start gap-3 text-xs text-teal-800">
                <HelpIcon size={16} className="text-indigo-600 mt-0.5 flex-none" />
                <div className="space-y-1">
                  <p className="font-bold text-indigo-950 text-xs">Simulated Sandbox Sandbox Mode</p>
                  <p className="leading-relaxed leading-relaxed">
                    Under simulation mode, SMS requests bypass live international carrier routing. SMS logs will simulate processing delays, format metrics, and random network carrier outcomes (success/fails tags) for zero delivery charges. Perfect for system verification and playground test displays!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Type TWILIO Settings View */}
          {activeGateway.type === 'twilio' && (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <KeyRound size={11} /> Twilio Account SID *
                  </label>
                  <input
                    type="text"
                    value={activeGateway.settings.twilioSid || ''}
                    onChange={(e) => updateGatewaySettingField(activeGateway.id, 'twilioSid', e.target.value)}
                    placeholder="e.g. AC8749bc6a..."
                    className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <KeyRound size={11} /> Twilio Auth Token *
                  </label>
                  <input
                    type="password"
                    value={activeGateway.settings.twilioToken || ''}
                    onChange={(e) => updateGatewaySettingField(activeGateway.id, 'twilioToken', e.target.value)}
                    placeholder="Provide token value"
                    className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Globe size={11} /> Twilio Sender Number *
                </label>
                <input
                  type="text"
                  value={activeGateway.settings.twilioFrom || ''}
                  onChange={(e) => updateGatewaySettingField(activeGateway.id, 'twilioFrom', e.target.value)}
                  placeholder="e.g. +14155552671"
                  className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-400">Matches the virtual sender ID purchased from Twilio dashboard</span>
              </div>
            </div>
          )}

          {/* Type CUSTOM HTTP Settings View */}
          {activeGateway.type === 'custom' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-150 pb-1.5">End-point Target Address Connection</span>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMS Provider HTTP Request URL *</label>
                    <input
                      type="text"
                      value={activeGateway.settings.url || ''}
                      onChange={(e) => updateGatewaySettingField(activeGateway.id, 'url', e.target.value)}
                      placeholder="e.g. https://sms.kftel.hk/eims/api/sendSms"
                      className="w-full text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method type</label>
                    <select
                      value={activeGateway.settings.method || 'POST'}
                      onChange={(e) => updateGatewaySettingField(activeGateway.id, 'method', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      <option value="POST">POST (Recommended)</option>
                      <option value="GET">GET (Query String)</option>
                    </select>
                  </div>
                </div>

                {activeGateway.settings.method === 'POST' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payload Body Content-Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="contentType"
                          checked={activeGateway.settings.contentType === 'application/json'}
                          onChange={() => updateGatewaySettingField(activeGateway.id, 'contentType', 'application/json')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        application/json
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="contentType"
                          checked={activeGateway.settings.contentType === 'application/x-www-form-urlencoded'}
                          onChange={() => updateGatewaySettingField(activeGateway.id, 'contentType', 'application/x-www-form-urlencoded')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        application/x-www-form-urlencoded
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Security parameters credentials map */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-150 pb-1.5">Authentication / Credentials Parameters</span>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  Enterprise gateways require a specific token identifier representing username and private key passwords. Map the API parameter keys and their private values:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username API Key identifier */}
                  <div className="p-3 bg-white border border-slate-100 rounded-lg grid grid-cols-2 gap-2">
                    <div className="space-y-1 col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Gateway User/Access key</div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 italic">API Parameter key</span>
                      <input
                        type="text"
                        value={activeGateway.settings.queryIdField || ''}
                        onChange={(e) => updateGatewaySettingField(activeGateway.id, 'queryIdField', e.target.value)}
                        placeholder="e.g. username"
                        className="w-full text-[11px] font-mono p-1 border border-slate-200 hover:border-slate-300 rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 italic">Parameter Private Value</span>
                      <input
                        type="text"
                        value={activeGateway.settings.queryIdVal || ''}
                        onChange={(e) => updateGatewaySettingField(activeGateway.id, 'queryIdVal', e.target.value)}
                        placeholder="e.g. corp_admin"
                        className="w-full text-[11px] font-mono p-1 border border-slate-200 hover:border-slate-300 rounded"
                      />
                    </div>
                  </div>

                  {/* Password token key identifier */}
                  <div className="p-3 bg-white border border-slate-100 rounded-lg grid grid-cols-2 gap-2">
                    <div className="space-y-1 col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Gateway Password/API Access Token</div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 italic">API Parameter key</span>
                      <input
                        type="text"
                        value={activeGateway.settings.querySecField || ''}
                        onChange={(e) => updateGatewaySettingField(activeGateway.id, 'querySecField', e.target.value)}
                        placeholder="e.g. password"
                        className="w-full text-[11px] font-mono p-1 border border-slate-200 hover:border-slate-300 rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 italic">Parameter Private Value</span>
                      <input
                        type="password"
                        value={activeGateway.settings.querySecVal || ''}
                        onChange={(e) => updateGatewaySettingField(activeGateway.id, 'querySecVal', e.target.value)}
                        placeholder="Provide secret token"
                        className="w-full text-[11px] font-mono p-1 border border-slate-200 hover:border-slate-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payload dynamic parsing fields mapping */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-150 pb-1.5">Gateway Content Param Map</span>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  We need to tell the server which API properties contain the recipient phone number and SMS content. EIMS typical parameter defaults:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receiver Field parameter name *</label>
                    <input
                      type="text"
                      value={activeGateway.settings.phoneField || 'mobile'}
                      onChange={(e) => updateGatewaySettingField(activeGateway.id, 'phoneField', e.target.value)}
                      placeholder="e.g. to or mobile or phone"
                      className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[9px] text-slate-400">Typical values: <strong className="font-mono">mobile</strong>, <strong className="font-mono">to</strong>, <strong className="font-mono">dest</strong>, <strong className="font-mono">tel</strong></span>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SMS Text Message parameter name *</label>
                    <input
                      type="text"
                      value={activeGateway.settings.textField || 'message'}
                      onChange={(e) => updateGatewaySettingField(activeGateway.id, 'textField', e.target.value)}
                      placeholder="e.g. content or message"
                      className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[9px] text-slate-400">Typical values: <strong className="font-mono">message</strong>, <strong className="font-mono">content</strong>, <strong className="font-mono">text</strong>, <strong className="font-mono">msg</strong></span>
                  </div>
                </div>
              </div>

              {/* Headers management block */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-150 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Header configurations (Optional)</span>
                  <button
                    type="button"
                    onClick={() => handleAddHeader(activeGateway.id)}
                    className="px-2 py-1 bg-white hover:bg-slate-100/50 text-indigo-600 rounded border border-slate-200 text-[10px] font-bold transition-colors flex items-center gap-0.5"
                  >
                    <Plus size={10} /> Add Header
                  </button>
                </div>

                {(activeGateway.settings.headers || []).length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No custom request headers appended</p>
                ) : (
                  <div className="space-y-2">
                    {(activeGateway.settings.headers || []).map((header, index) => (
                      <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) => handleUpdateHeader(activeGateway.id, index, e.target.value, header.value)}
                          placeholder="Header Key (e.g., ApiKey)"
                          className="w-1/2 p-1 border font-mono text-[11px] rounded"
                        />
                        <input
                          type="text"
                          value={header.value}
                          onChange={(e) => handleUpdateHeader(activeGateway.id, index, header.key, e.target.value)}
                          placeholder="Header Value"
                          className="w-1/2 p-1 border font-mono text-[11px] rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveHeader(activeGateway.id, index)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-300 hover:text-rose-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom payload parameters block */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-150 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Additional static query/body parameters</span>
                  <button
                    type="button"
                    onClick={() => handleAddParam(activeGateway.id)}
                    className="px-2 py-1 bg-white hover:bg-slate-100/50 text-indigo-600 rounded border border-slate-200 text-[10px] font-bold transition-colors flex items-center gap-0.5"
                  >
                    <Plus size={10} /> Add Param
                  </button>
                </div>

                {(activeGateway.settings.additionalParams || []).length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No extra static fields mapped</p>
                ) : (
                  <div className="space-y-2">
                    {(activeGateway.settings.additionalParams || []).map((param, index) => (
                      <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) => handleUpdateParam(activeGateway.id, index, e.target.value, param.value)}
                          placeholder="Param Key (e.g., unicode)"
                          className="w-1/2 p-1 border font-mono text-[11px] rounded"
                        />
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => handleUpdateParam(activeGateway.id, index, param.key, e.target.value)}
                          placeholder="Param Value (e.g., 1)"
                          className="w-1/2 p-1 border font-mono text-[11px] rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(activeGateway.id, index)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-300 hover:text-rose-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Type EASYSEND Settings View */}
          {activeGateway.type === 'easysend' && (
            <div id="gatewaysettings-easysend-form" className="space-y-4 font-sans animate-in fade-in duration-200">
              <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
                <HelpIcon size={16} className="text-indigo-600 mt-0.5 flex-none" />
                <div className="space-y-1">
                  <p className="font-bold text-indigo-950 text-xs">Easy Send Live API Channel</p>
                  <p className="leading-relaxed">
                    Under Live Channel, SMS broadcasts correspond to direct carrier endpoints. Ensure your Easy Send APIs are funded and credentials are set correctly.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <KeyRound size={11} className="text-indigo-500" /> Easy Send API Token / Key *
                  </label>
                  <input
                    type="password"
                    value={activeGateway.settings.easysendApiKey || ''}
                    onChange={(e) => updateGatewaySettingField(activeGateway.id, 'easysendApiKey', e.target.value)}
                    placeholder="Enter Easy Send Private API Token"
                    className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <span className="text-[9px] text-slate-400">Private key generated under your Easy Send Profile settings.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe size={11} className="text-indigo-500" /> Sender ID / Originator Code
                  </label>
                  <input
                    type="text"
                    value={activeGateway.settings.easysendSenderId || ''}
                    onChange={(e) => updateGatewaySettingField(activeGateway.id, 'easysendSenderId', e.target.value)}
                    placeholder="e.g. ULTRA"
                    className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <span className="text-[9px] text-slate-400 font-medium">Approved Sender Name displayed on cell phones.</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ServerCrash size={11} className="text-indigo-500" /> Easy Send URL Endpoint
                </label>
                <input
                  type="text"
                  value={activeGateway.settings.easysendUrl || ''}
                  onChange={(e) => updateGatewaySettingField(activeGateway.id, 'easysendUrl', e.target.value)}
                  placeholder="e.g. https://api.easysendsms.app/v1/send"
                  className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[9px] text-slate-400 text-[9px]">Defaults to Standard Easy Send routing endpoint API.</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
              <Check size={14} className="text-emerald-600" /> {successMsg}
            </div>
          )}

          <button
            id="btn-save-gateway-config"
            onClick={handleSaveConfigs}
            className="w-full py-3 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save size={14} /> Commit Outbound Gateway Configs
          </button>
        </div>

        {/* Sidebar help guidelines */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 text-slate-300 p-6 rounded-xl space-y-4">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert size={14} /> SECURITY PROTOCOL</span>

          <div className="space-y-3.5 text-xs font-sans leading-relaxed text-slate-400">
            <p>
              Your sensitive tokens, Account SIDs, passcodes and URLs remain absolutely secure because all outgoing dispatch sequences are handled **entirely server-side** via the Node.js Express server (`/api/send-sms`).
            </p>
            <p>
              This bypasses standard web CORS blocks, ensuring that external carriers (like `sms.kftel.hk` parameters or direct Twilio APIs) receive correct, authorized requests without exposing keys in public browser headers.
            </p>
            <p className="font-bold text-slate-200">
              EIMS Shortcut Presets:
            </p>
            <p>
              If connecting kftel HK services, select **Custom HTTP REST Gateway**, configure the connection URL, add parameters for credentials corresponding to your portal profile, and set the receiver mobile cell mapping parameters accordingly!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
