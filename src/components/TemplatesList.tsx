import React, { useState, useMemo } from 'react';
import { MessageTemplate } from '../types';
import { FileText, PlusCircle, Trash2, Code, FileSignature, AlertCircle, Bookmark } from 'lucide-react';

interface TemplatesListProps {
  templates: MessageTemplate[];
  onAddTemplate: (template: Omit<MessageTemplate, 'id' | 'variables'>) => void;
  onDeleteTemplate: (id: string) => void;
}

export default function TemplatesList({
  templates,
  onAddTemplate,
  onDeleteTemplate
}: TemplatesListProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errorText, setErrorText] = useState('');

  // Dynamically analyze which placeholders exist in the text in real-time
  const dynamicPlaceholders = useMemo(() => {
    const regex = /{([^}]+)}/g;
    const found: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!found.includes(match[1].toLowerCase())) {
        found.push(match[1].toLowerCase());
      }
    }
    return found;
  }, [content]);

  // Handle template submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!title.trim()) {
      setErrorText('Specify a descriptive layout title');
      return;
    }
    if (!content.trim()) {
      setErrorText('Compose default message text');
      return;
    }

    onAddTemplate({
      title: title.trim(),
      content: content.trim()
    });

    // Reset forms
    setTitle('');
    setContent('');
  };

  return (
    <div id="templates-management" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create template form */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs h-fit space-y-4">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <FileSignature size={16} className="text-indigo-500" /> Save New SMS Template
          </h4>
          <p className="text-xs text-slate-400">Save templates for quick layout selectors on the dispatch center</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VIP Appointment Reminder"
              className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMS Message Content *</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setContent(prev => prev + ' {name}')}
                  className="px-1.5 py-0.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-600 text-[8px] font-black"
                >
                  + name
                </button>
                <button
                  type="button"
                  onClick={() => setContent(prev => prev + ' {company}')}
                  className="px-1.5 py-0.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-600 text-[8px] font-black"
                >
                  + company
                </button>
              </div>
            </div>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hi {name}, your customized VIP priority reservation with {company} is successfully booked!"
              rows={4}
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Real-time variable highlights */}
          {dynamicPlaceholders.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Code size={11} className="text-slate-400" /> Detected Variables:
              </span>
              <div className="flex flex-wrap gap-1">
                {dynamicPlaceholders.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-violet-50 text-indigo-700 border border-indigo-100 font-mono text-[9px] font-black">
                    {'{'}{tag}{'}'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {errorText && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-150 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {errorText}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 hover:shadow-xs rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle size={14} /> Create SMS Template
          </button>
        </form>
      </div>

      {/* List templates directory */}
      <div className="lg:col-span-2 space-y-4">
        <h4 className="font-semibold text-slate-800 text-sm">Stored Shortcut Templates Dashboard</h4>

        {templates.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-100 shadow-xs">
            <p className="text-xs text-slate-400">No custom templates stored yet. Write one to list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-slate-100 hover:border-slate-200 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden group">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 truncate">
                      <Bookmark size={13} className="text-indigo-500" /> {t.title}
                    </h5>
                    <button
                      onClick={() => onDeleteTemplate(t.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete saved template"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans whitespace-pre-wrap select-all">
                    {t.content}
                  </p>
                </div>

                {t.variables && t.variables.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[9px] text-slate-400 font-medium">Mapped layout keys:</span>
                    {t.variables.map(v => (
                      <span key={v} className="px-1.5 py-0.5 rounded bg-indigo-50/50 text-indigo-600 text-[8px] font-bold font-mono tracking-wider">
                        {'{'}{v}{'}'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400 italic">No variables parsed (plain SMS text)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
