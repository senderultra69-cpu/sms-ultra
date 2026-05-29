import React, { useState, useMemo } from 'react';
import { Contact, ContactGroup } from '../types';
import { Users, UserPlus, FolderPlus, Trash2, Import, Clipboard, Check, Search, PlusCircle, Bookmark, Briefcase } from 'lucide-react';

interface ContactsListProps {
  contacts: Contact[];
  groups: ContactGroup[];
  onAddContact: (contact: Omit<Contact, 'id' | 'timestamp'>) => void;
  onDeleteContact: (id: string) => void;
  onCreateGroup: (name: string, contactIds: string[]) => void;
  onDeleteGroup: (id: string) => void;
}

export default function ContactsList({
  contacts,
  groups,
  onAddContact,
  onDeleteContact,
  onCreateGroup,
  onDeleteGroup
}: ContactsListProps) {
  // Tabs for sub navigation
  const [subTab, setSubTab] = useState<'all' | 'groups' | 'import'>('all');

  // Contact manual addition form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  // Group manual state
  const [groupName, setGroupName] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Search keyword filters
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk CSV pasting state
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const txt = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(txt) ||
        c.phone.includes(txt) ||
        (c.company && c.company.toLowerCase().includes(txt)) ||
        (c.notes && c.notes.toLowerCase().includes(txt))
      );
    });
  }, [contacts, searchQuery]);

  // Submit manual contact
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onAddContact({
      name: name.trim(),
      phone: phone.trim().replace(/[^\d+]/g, ''),
      company: company.trim() || undefined,
      notes: notes.trim() || undefined
    });

    // Reset fields
    setName('');
    setPhone('');
    setCompany('');
    setNotes('');
  };

  // Submit new group
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    onCreateGroup(groupName.trim(), selectedContactIds);

    // Reset
    setGroupName('');
    setSelectedContactIds([]);
  };

  // Toggle contacts in selectedContactIds for group creation
  const toggleContactSelection = (id: string) => {
    setSelectedContactIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
  };

  // Bulk copy-paste parser
  const handleBulkImport = () => {
    if (!bulkCsvText.trim()) {
      setImportStatus('No text payload provided');
      return;
    }

    const lines = bulkCsvText.split('\n');
    let addedCount = 0;
    let failedCount = 0;

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Expect format: Name, Phone, Company, Notes
      const cols = cleanLine.split(/[,;\t]+/);
      if (cols.length >= 2) {
        const contactName = cols[0].trim();
        const contactPhone = cols[1].replace(/[^\d+]/g, '').trim();
        const contactCompany = cols[2] ? cols[2].trim() : undefined;
        const contactNotes = cols[3] ? cols[3].trim() : undefined;

        if (contactName && contactPhone) {
          onAddContact({
            name: contactName,
            phone: contactPhone,
            company: contactCompany,
            notes: contactNotes
          });
          addedCount++;
        } else {
          failedCount++;
        }
      } else {
        failedCount++;
      }
    });

    setImportStatus(`Success! Imported ${addedCount} records. Ignored/failed ${failedCount} malformed entries.`);
    setBulkCsvText('');
  };

  return (
    <div id="contacts-management" className="space-y-6">
      {/* Sub tabs nav */}
      <div className="flex border-b border-slate-100 gap-1 pb-px">
        <button
          onClick={() => setSubTab('all')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            subTab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          All Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setSubTab('groups')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            subTab === 'groups'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Contact Groups ({groups.length})
        </button>
        <button
          onClick={() => setSubTab('import')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            subTab === 'import'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Bulk Paste CSV Import
        </button>
      </div>

      {subTab === 'all' && (
        <div id="contacts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add contact manual form */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs h-fit space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <UserPlus size={16} className="text-indigo-500" /> New Single Contact
              </h4>
              <p className="text-xs text-slate-400">Save a direct cell profile for ongoing dispatches</p>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Mobile *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +85291234567"
                  className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company / Agency (Optional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. EIMS Tech"
                  className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP Member"
                  className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 hover:shadow-xs rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle size={14} /> Add to list
              </button>
            </form>
          </div>

          {/* Directory search & list */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Contacts Directory</h4>
                <p className="text-xs text-slate-400">Manage cells and map placeholders</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, labels..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 text-slate-700 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-lg border border-dashed border-slate-100">
                  <p className="text-xs text-slate-400">No matching contacts found</p>
                </div>
              ) : (
                <table className="w-full text-xs text-left text-slate-500">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-2 font-black">Contact profile</th>
                      <th className="py-3 px-2 font-black">Mobile line</th>
                      <th className="py-3 px-2 font-black">Company tag</th>
                      <th className="py-3 px-2 font-black">Notes info</th>
                      <th className="py-3 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(c => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-2">
                          <span className="font-semibold text-slate-800">{c.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-indigo-500 tabular-nums">
                          {c.phone}
                        </td>
                        <td className="py-3 px-2">
                          {c.company ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              <Briefcase size={10} /> {c.company}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 truncate max-w-44" title={c.notes}>
                          {c.notes || <span className="text-slate-300 italic">-</span>}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => onDeleteContact(c.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove account entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'groups' && (
        <div id="groups-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Group Form Side */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs h-fit space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <FolderPlus size={16} className="text-indigo-500" /> Save Outbound Group
              </h4>
              <p className="text-xs text-slate-400">Bundle users under a campaign tag for shortcut dispatch</p>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group identifier *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. VIP Promo List Q3"
                  className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Member check-selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Assign list members *</span>
                  <span className="text-indigo-600 font-mono text-[10px] lowercase">{selectedContactIds.length} chosen</span>
                </label>
                <div className="border border-slate-150 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 bg-slate-50/50">
                  {contacts.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-4">Add some contacts first</p>
                  ) : (
                    contacts.map(c => (
                      <div
                        key={c.id}
                        onClick={() => toggleContactSelection(c.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer select-none transition-colors ${
                          selectedContactIds.includes(c.id)
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'hover:bg-slate-150 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(c.id)}
                          readOnly
                          className="rounded-xs text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate flex-1">{c.name} <span className="font-mono font-normal text-[10px] text-slate-400">({c.phone})</span></span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!groupName.trim() || selectedContactIds.length === 0}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 ${
                  !groupName.trim() || selectedContactIds.length === 0
                    ? 'bg-slate-200 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xs cursor-pointer'
                }`}
              >
                <PlusCircle size={14} /> Create Bundle Group
              </button>
            </form>
          </div>

          {/* Group display boards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h4 className="font-semibold text-slate-800 text-sm">Stored Campaign Target Groups</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1">Select group identifiers on the Send panel to bulk map placeholders.</p>
              </div>

              {groups.length === 0 ? (
                <div className="md:col-span-2 text-center py-10 bg-slate-50/50 rounded-lg border border-dashed border-slate-100">
                  <p className="text-xs text-slate-400">No custom outbound groups established yet</p>
                </div>
              ) : (
                groups.map(g => (
                  <div key={g.id} className="bg-slate-55 border border-slate-100 hover:border-slate-200 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-xs relative overflow-hidden transition-all group">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between">
                        <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Bookmark size={13} className="text-indigo-500" /> {g.name}
                        </h5>
                        <button
                          onClick={() => onDeleteGroup(g.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Erase group template"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-500 font-semibold font-mono">{g.contactIds.length} verified recipient(s)</p>
                    </div>

                    <div className="text-[10px] text-slate-400 bg-white/75 p-2 rounded-md max-h-24 overflow-y-auto">
                      <p className="font-semibold text-[9px] text-slate-400 mb-1 border-b border-slate-100/50 pb-0.5 uppercase tracking-wider">Group Sample Members:</p>
                      {g.contactIds.map(cid => {
                        const m = contacts.find(c => c.id === cid);
                        return m ? (
                          <div key={cid} className="truncate select-none py-0.5">
                            • {m.name} <span className="font-mono text-[9px] text-slate-400">({m.phone})</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'import' && (
        <div id="bulk-import-panel" className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Import size={16} className="text-indigo-500" /> Bulk Paste Plain text / CSV Parsing
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              If you have thousands of clients in Excel, CSV, or Notepad files, quickly copy-paste them below. The parser automatically structures cell lines, cleans phone country formats, and matches companies.
            </p>
          </div>

          <div id="paste-input-area" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clipboard size={12} /> Text Clipboard Content</span>
                <span className="text-slate-400">Columns separator: <strong className="font-mono">COMMA ( , )</strong> or <strong className="font-mono">TAB ( \t )</strong></span>
              </div>

              <textarea
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                placeholder="Alice, +85291234567, Google Corp, CEO
Bob, 85292345678, Meta Web, Staff Account
Charlie Brown, 85293456789,, Special Customer Segment"
                rows={8}
                className="w-full text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-3 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
              />

              {importStatus && (
                <div className="p-3 bg-violet-50 text-indigo-800 rounded-lg border border-indigo-100 text-xs font-medium flex items-center gap-2">
                  <Check size={14} className="text-indigo-600" /> {importStatus}
                </div>
              )}

              <button
                onClick={handleBulkImport}
                className="px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle size={14} /> Parse & Save entries
              </button>
            </div>

            <div className="lg:col-span-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 space-y-3 text-xs leading-relaxed text-indigo-900/80">
              <strong className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-widest">CSV Clipboard Schema:</strong>
              <p className="text-[11px]">
                Paste rows complying with this standard structure pattern:
              </p>
              <div className="bg-white/80 p-2 border border-indigo-100 rounded-md font-mono text-[10px] text-indigo-950 leading-relaxed tabular-nums">
                Name, Mobile, Company, Notes
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] pt-1">
                <li>The first column must represent the recipient's Name.</li>
                <li>The second column must represent the cellular phone numbers.</li>
                <li>The third column represents optional Company tags (for replace templates).</li>
                <li>The fourth column stores generic dynamic Notes variables.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
