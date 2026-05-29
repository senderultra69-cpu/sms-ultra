import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Contact, ContactGroup, MessageTemplate, Gateway } from '../types';
import { Send, Clock, Sparkles, FileText, Group, Users, HelpCircle, Info, ChevronRight, AlertCircle, AlertTriangle, Upload, FileSpreadsheet, Trash2 } from 'lucide-react';

interface SendSmsProps {
  contacts: Contact[];
  groups: ContactGroup[];
  templates: MessageTemplate[];
  activeGateway: Gateway;
  smsCostPerPart: number;
  onSendSms: (payload: {
    recipientList: { phone: string; name?: string; content: string }[];
    isScheduled: boolean;
    scheduledTime?: string;
  }) => Promise<any>;
}

export default function SendSms({ contacts, groups, templates, activeGateway, smsCostPerPart, onSendSms }: SendSmsProps) {
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [smsText, setSmsText] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [sending, setSending] = useState(false);
  const [errorLog, setErrorLog] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // CSV Bulk Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedCsvRecipients, setUploadedCsvRecipients] = useState<{ phone: string; name?: string; company?: string; notes?: string; customMessage?: string }[]>([]);

  // Parser: Simple CSV parsing logic
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length === 0) return;

      // Extract and normalize headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"‘“’]/g, ''));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('number') || h.includes('mobile'));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('organization'));
      const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('notes'));
      const msgIdx = headers.findIndex(h => h.includes('message') || h.includes('text') || h.includes('sms') || h.includes('msg'));

      const parsed: typeof uploadedCsvRecipients = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Splitting that respects quotes
        const cols: string[] = [];
        let item = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(item.trim());
            item = '';
          } else {
            item += char;
          }
        }
        cols.push(item.trim());

        // Select column values or guess indexes
        const phoneRaw = (phoneIdx !== -1 ? cols[phoneIdx] : cols[0]) || '';
        const cleanPhone = phoneRaw.replace(/[^\d+]/g, '');
        const nameVal = (nameIdx !== -1 ? cols[nameIdx] : cols[1]) || '';
        const companyVal = (companyIdx !== -1 ? cols[companyIdx] : cols[2]) || '';
        const notesVal = (notesIdx !== -1 ? cols[notesIdx] : cols[3]) || '';
        const customMessageVal = (msgIdx !== -1 ? cols[msgIdx] : undefined);

        if (cleanPhone) {
          parsed.push({
            phone: cleanPhone,
            name: nameVal.trim() || 'Valued Client',
            company: companyVal.trim(),
            notes: notesVal.trim(),
            customMessage: customMessageVal?.trim()
          });
        }
      }

      if (parsed.length > 0) {
        setUploadedCsvRecipients(parsed);
        setErrorLog('');
      } else {
        alert("Make sure column headers exist. For example first row must contain 'phone, name, message'");
      }

      // Reset file input value to allow uploading same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearCsv = () => {
    setUploadedCsvRecipients([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper: Detect Unicode character presence
  const isUnicode = useMemo(() => {
    // Standard GSM 03.38 character set check
    const gsmRegex = /^[A-Za-z0-9\s!"#$%&'()*+,\-./:;<=>?@_¡£¥§¿äöñüàèòùìòÇØøÅå\n\r]*$/;
    return !gsmRegex.test(smsText);
  }, [smsText]);

  // Helper: Calculate standard SMS parts and character count
  const smsMetrics = useMemo(() => {
    const charsCount = smsText.length;
    if (charsCount === 0) return { chars: 0, parts: 1, limit: 160, type: 'GSM-7' };

    const type = isUnicode ? 'Unicode (UCS-2)' : 'GSM-7 (Standard)';
    const maxSinglePart = isUnicode ? 70 : 160;
    const multiPartUnit = isUnicode ? 67 : 153;

    let parts = 1;
    if (charsCount > maxSinglePart) {
      parts = Math.ceil(charsCount / multiPartUnit);
    }

    return {
      chars: charsCount,
      parts,
      limit: charsCount > maxSinglePart ? multiPartUnit : maxSinglePart,
      type
    };
  }, [smsText, isUnicode]);

  // Parse all target recipients from inputs (Manual list OR chosen Groups)
  const parsedRecipients = useMemo(() => {
    const results: { phone: string; name?: string; company?: string; notes?: string; customMessage?: string }[] = [];

    // 1. Apply selected Contacts from group if configured
    if (selectedGroupId) {
      const targetGroup = groups.find(g => g.id === selectedGroupId);
      if (targetGroup) {
        targetGroup.contactIds.forEach(id => {
          const matchContact = contacts.find(c => c.id === id);
          if (matchContact) {
            results.push({
              phone: matchContact.phone,
              name: matchContact.name,
              company: matchContact.company,
              notes: matchContact.notes
            });
          }
        });
      }
    }

    // 2. Add manually parsed phone numbers from input box
    if (phoneNumberInput.trim()) {
      // Split by commas, semicolons, tabs, custom spaces, or linebreaks
      const rawLines = phoneNumberInput.split(/[\n,;\t]+/);
      rawLines.forEach(line => {
        const cleanVal = line.trim();
        if (cleanVal) {
          // Check if format is "Name:Phone" or just "Phone"
          if (cleanVal.includes(':')) {
            const parts = cleanVal.split(':');
            const possibleName = parts[0].trim();
            const possiblePhone = parts[1].replace(/[^\d+]/g, ''); // keep numbers and optional "+"
            if (possiblePhone) {
              results.push({ phone: possiblePhone, name: possibleName });
            }
          } else {
            const cleanPhone = cleanVal.replace(/[^\d+]/g, '');
            if (cleanPhone) {
              // Check if matching contact already exists to pull metadata
              const existing = contacts.find(c => c.phone.replace(/[^\d+]/g, '') === cleanPhone);
              if (existing) {
                results.push({
                  phone: cleanPhone,
                  name: existing.name,
                  company: existing.company,
                  notes: existing.notes
                });
              } else {
                results.push({ phone: cleanPhone, name: 'Valued Client' });
              }
            }
          }
        }
      });
    }

    // 3. Add imported CSV records
    if (uploadedCsvRecipients.length > 0) {
      uploadedCsvRecipients.forEach(rec => {
        results.push({
          phone: rec.phone,
          name: rec.name,
          company: rec.company,
          notes: rec.notes,
          customMessage: rec.customMessage
        });
      });
    }

    // Filter duplicate phones to avoid wasteful duplicate SMS charges
    const uniqueMap = new Map<string, typeof results[0]>();
    results.forEach(item => {
      uniqueMap.set(item.phone, item);
    });

    return Array.from(uniqueMap.values());
  }, [phoneNumberInput, selectedGroupId, groups, contacts, uploadedCsvRecipients]);

  // Handle template selection change
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    if (templateId) {
      const match = templates.find(t => t.id === templateId);
      if (match) {
        setSmsText(match.content);
      }
    }
  };

  // Helper function to substitute variables like {name} or {company}
  const substituteVariables = (text: string, person: { name?: string; company?: string; notes?: string; customMessage?: string }) => {
    if (person.customMessage) {
      return person.customMessage;
    }
    let output = text;
    // Standard variables
    output = output.replace(/{name}/gi, person.name || 'Valued Client');
    output = output.replace(/{company}/gi, person.company || 'Ultra Sender');
    output = output.replace(/{notes}/gi, person.notes || 'Information');
    return output;
  };

  // Live personalized previews for up to 3 recipients
  const previewList = useMemo(() => {
    return parsedRecipients.slice(0, 3).map(rec => ({
      phone: rec.phone,
      name: rec.name,
      message: substituteVariables(smsText, rec)
    }));
  }, [parsedRecipients, smsText]);

  // Dispatch click handler
  const handleDispatch = async () => {
    setErrorLog('');
    setSuccessCount(null);

    // Form Validators
    if (parsedRecipients.length === 0) {
      setErrorLog('Please specify at least one valid phone contact or group registry');
      return;
    }
    if (!smsText.trim()) {
      setErrorLog('Please compose a message block before initiating dispatch');
      return;
    }
    if (isScheduled && !scheduledDateTime) {
      setErrorLog('Please select a target date and time schedule for delayed transmission');
      return;
    }

    setSending(true);

    try {
      // Map recipients with expanded tailored messages
      const payloadList = parsedRecipients.map(r => ({
        phone: r.phone,
        name: r.name,
        content: substituteVariables(smsText, r)
      }));

      const response = await onSendSms({
        recipientList: payloadList,
        isScheduled,
        scheduledTime: isScheduled ? scheduledDateTime : undefined
      });

      if (response && response.success) {
        setSuccessCount(payloadList.length);
        setPhoneNumberInput('');
        setSelectedGroupId('');
        setSmsText('');
        setIsScheduled(false);
        setUploadedCsvRecipients([]);
      } else {
        setErrorLog(response?.error || 'Unknown dispatch execution failure.');
      }
    } catch (err: any) {
      setErrorLog(err.message || 'Server transmission error.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div id="sms-sender" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Compose and Target Side */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs lg:col-span-7 space-y-5">
        <div className="flex items-center justify-between border-b border-rose-50/10 pb-4">
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Quick Send shortcut Compose</h4>
            <p className="text-xs text-slate-400">Launch standard or custom template messages in real time</p>
          </div>
          <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-500">
            Active gateway: <span className="text-indigo-600 font-mono font-black">{activeGateway.name}</span>
          </span>
        </div>

        {/* Recipients input option */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Users size={14} className="text-slate-400" /> Recipients Contact & Destination
            </label>
            <span className="text-[10px] text-slate-400">Total detected: <strong className="text-indigo-600 font-mono text-sm">{parsedRecipients.length}</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Select existing contact group */}
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Select Group</span>
              <select
                id="group-selector"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full text-xs bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- No Contact Group Selected --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.contactIds.length} contacts)</option>
                ))}
              </select>
            </div>

            {/* Select template */}
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Quick Template load</span>
              <select
                id="template-sms-selector"
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                className="w-full text-xs bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Manual Writing Mode --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Excel / CSV upload uploader and format sample downloader */}
          <div className="bg-indigo-50/40 border border-indigo-100/80 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                <FileSpreadsheet size={13} className="text-indigo-600" /> Excel / CSV Bulk Upload
              </span>
              <button 
                type="button"
                onClick={() => {
                  const demoCsv = "phone,name,company,notes,message\n+85291234567,Ravi Verma,Ultra Sender,Invoice,Hello Ravi from Ultra Sender. Your invoice total is $150 USD\n+85298765432,Preeti Sharma,Retail,Promo,Hello Preeti your exclusive discount portal is active";
                  const blob = new Blob([demoCsv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", "ultra_sender_sample.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="text-[9px] font-bold text-indigo-700 hover:underline flex items-center gap-0.5"
                title="Download standard CSV upload format sample sheet"
              >
                📥 Download Format Sample CSV
              </button>
            </div>

            <div className="text-[10px] text-indigo-900 grid grid-cols-1 sm:grid-cols-2 gap-3 leading-normal">
              <div>
                <p className="font-bold text-indigo-950">CSV Upload Format Guide:</p>
                <p className="mt-0.5 text-slate-500">First row headers should contain: <code className="bg-white px-1 py-0.5 rounded border border-indigo-100 font-mono text-[9px]">phone</code>, <code className="bg-white px-1 py-0.5 rounded border border-indigo-100 font-mono text-[9px]">name</code>, etc.</p>
                <p className="text-slate-400 text-[9.5px] mt-1 italic">If a "message" column is present, standard text template gets overridden per client.</p>
              </div>
              <div className="bg-white/80 p-2 rounded border border-indigo-100 select-all font-mono text-[9px] text-indigo-950 whitespace-pre">
phone,name,company,message
+85291234567,Ravi,CompanyA,Hi Ravi
+85292345678,Preeti,CompanyB,Hi Preeti
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                ref={fileInputRef}
                onChange={handleCsvUpload}
                id="sms-csv-uploader"
                className="hidden"
              />
              <label
                htmlFor="sms-csv-uploader"
                className="cursor-pointer text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Upload size={13} /> Select CSV File
              </label>

              {uploadedCsvRecipients.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-1 rounded-md">
                    Selected: {uploadedCsvRecipients.length} CSV contact(s)
                  </span>
                  <button
                    type="button"
                    onClick={handleClearCsv}
                    className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-md transition-colors"
                    title="Remove CSV file"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400">No batch CSV imported yet.</span>
              )}
            </div>
          </div>

          {/* Manual input list */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Manual Line Numbers</span>
              <span className="text-[10px] text-slate-400 italic">Separate with commas, spaces, or linebreaks. Ex: "John: +85212345678" or "+85298765432"</span>
            </div>
            <textarea
              id="textbox-numbers"
              value={phoneNumberInput}
              onChange={(e) => setPhoneNumberInput(e.target.value)}
              placeholder="Ex:
+85291234567
Alice: +85292345678
85293456789"
              rows={3}
              className="w-full font-mono text-xs text-slate-700 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg p-3 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Message body creator */}
        <div id="sms-text-creator" className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5"><FileText size={14} className="text-slate-400" /> SMS Text Content</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSmsText(prev => prev + ' {name}')}
                className="px-1.5 py-0.5 rounded-sm bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[9px] font-bold"
                title="Dynamic Name placeholder"
              >
                + Name Tag
              </button>
              <button
                onClick={() => setSmsText(prev => prev + ' {company}')}
                className="px-1.5 py-0.5 rounded-sm bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[9px] font-bold"
                title="Dynamic Company placeholder"
              >
                + Company Tag
              </button>
            </div>
          </div>

          <textarea
            id="sms-content-textarea"
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            placeholder="Type your SMS message here. Use `{name}` or `{company}` for customized contact replacements automatically."
            rows={5}
            className="w-full text-xs text-slate-700 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg p-3 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
          />

          {/* Core SMS Splitting metrics calculation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg text-[10px] border border-slate-100">
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium">Text length</span>
              <strong className="text-slate-700 font-mono text-xs">{smsMetrics.chars} characters</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium">Message segments</span>
              <strong className="text-indigo-600 font-mono text-xs">{smsMetrics.parts} SMS parts</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-550 font-bold text-indigo-700">Estimated Cost</span>
              <strong className="text-indigo-700 font-mono text-xs">${(smsMetrics.parts * parsedRecipients.length * smsCostPerPart).toFixed(2)} USD</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium">Encoding Type</span>
              <strong className="text-slate-700 font-mono text-[9px] uppercase tracking-wider">{smsMetrics.type}</strong>
            </div>
          </div>
        </div>

        {/* Schedule vs send controls */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="schedule-checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="w-4.5 h-4.5 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-200 bg-slate-50 cursor-pointer"
            />
            <label htmlFor="schedule-checkbox" className="text-xs text-slate-600 font-semibold cursor-pointer flex items-center gap-1">
              <Clock size={13} className="text-slate-400" /> Schedule send later
            </label>
          </div>

          {isScheduled && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-lg p-2 outline-hidden focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          )}
        </div>

        {/* Feedback alerts */}
        {errorLog && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle size={15} />
            <p className="flex-1 font-medium">{errorLog}</p>
          </div>
        )}

        {successCount !== null && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
            <Sparkles size={15} className="text-emerald-500 animate-bounce" />
            <p className="flex-1 font-medium">Successfully queued and transmitted bulk task matching <strong>{successCount} recipients</strong>!</p>
          </div>
        )}

        {/* Submission button */}
        <button
          id="btn-dispatch-sms"
          onClick={handleDispatch}
          disabled={sending}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white shadow-xs transition-all flex items-center justify-center gap-2 ${
            sending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md cursor-pointer'
          }`}
        >
          {sending ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Transmitting outgoing payloads...
            </>
          ) : (
            <>
              <Send size={15} />
              {isScheduled ? 'Schedule Outbound Dispatch' : `Send Shortcut Message to ${parsedRecipients.length} Target(s)`}
            </>
          )}
        </button>
      </div>

      {/* Preview and Dynamic variables guide side */}
      <div className="space-y-6 lg:col-span-5">
        {/* Dynamic parsing box */}
        <div id="receptors-queue" className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h5 className="font-semibold text-slate-800 text-xs">Recipient Queue Map ({parsedRecipients.length})</h5>
            <p className="text-[10px] text-slate-400">Dynamic layout variables parsed for distribution list</p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {parsedRecipients.length === 0 ? (
              <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-100">
                <Info size={18} className="mx-auto text-slate-300 mb-1" />
                <p className="text-xs">No active recipients added</p>
              </div>
            ) : (
              parsedRecipients.map((rec, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-100 rounded-lg">
                  <div className="truncate flex-1 pr-2">
                    <p className="font-semibold text-slate-700 truncate">{rec.name || 'Anonymous'}</p>
                    <p className="text-[10px] font-mono text-indigo-500 tabular-nums">{rec.phone}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    {rec.company ? (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase truncate max-w-28">{rec.company}</span>
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">No tag metadata</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Personalized Message Preview - styled precisely after the design theme's mockup */}
        <div className="space-y-4">
          <h5 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-500 animate-pulse" /> Live Handset Preview
          </h5>
          <div className="bg-white rounded-[2rem] p-4 border-[6px] border-slate-300 shadow-xl flex flex-col min-h-[380px] overflow-hidden">
            {/* Phone Notch */}
            <div className="w-1/3 h-4 bg-slate-300 rounded-b-xl mx-auto mb-4"></div>
            
            <div className="flex-1 flex flex-col gap-3 px-1">
              <div className="self-center text-[9px] text-slate-400 mb-1 font-mono uppercase">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              
              {previewList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs font-semibold">Ready to draft message</p>
                  <p className="text-[10px] mt-1">Live smartphone preview will mount here</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[240px] pr-1">
                  {previewList.map((pi, idx) => (
                    <div key={idx} className="bg-slate-100 text-[11px] p-2.5 rounded-2xl rounded-tl-none self-start max-w-[95%] border border-slate-200 select-all font-sans relative">
                      <div className="font-extrabold text-indigo-700 text-[10px] mb-1 tracking-tight flex items-center justify-between">
                        <span>{activeGateway.name === 'Twilio live Cloud Gateway' ? 'VERIFY_HUB' : 'KFTEL_CORP'}</span>
                        <span className="text-[8px] font-mono text-slate-400 font-normal ml-2">{pi.phone}</span>
                      </div>
                      <div className="text-slate-800 leading-relaxed font-sans text-xs">
                        {pi.message || <span className="text-slate-400 italic">No text composed...</span>}
                      </div>
                    </div>
                  ))}
                  {parsedRecipients.length > 3 && (
                    <div className="text-center font-bold text-[9px] text-indigo-700 bg-indigo-50/60 py-1 rounded-sm tracking-wider uppercase">
                      + {parsedRecipients.length - 3} other custom messages queued
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Fake bottom phone navigation block */}
            <div className="mt-auto pt-4 flex gap-2 px-1">
              <div className="flex-1 h-7 rounded-full bg-slate-50 border border-slate-200 text-[10px] text-slate-400 flex items-center px-3 font-sans">iMessage</div>
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white fill-current">
                <svg className="w-3.5 h-3.5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19V5m-7 7l7-7 7 7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-950 rounded-xl text-white shadow-xs">
            <div className="text-[10px] font-bold opacity-70 mb-1 flex items-center justify-between">
              <span>DELIVERY ESTIMATE</span>
              <span className="font-mono text-[9px] text-indigo-300">{(parsedRecipients.length * smsMetrics.parts * 0.1).toFixed(2)} Unit Cost</span>
            </div>
            <div className="text-sm font-medium flex items-center justify-between">
              <span>~3.5 seconds to HK / Glob</span>
              <span className="font-mono font-bold text-xs text-indigo-200">Rate: 0.1 / chunk</span>
            </div>
            <div className="mt-2 w-full bg-indigo-900 h-1.5 rounded-full">
              <div className="bg-indigo-400 w-3/4 h-full rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
