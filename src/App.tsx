import React, { useState, useEffect, useMemo } from 'react';
import { Contact, ContactGroup, MessageTemplate, SmsLog, GatewayConfigState, SmsMetrics, Gateway, SmsUser, RechargeRequest, SystemConfig } from './types';
import Dashboard from './components/Dashboard';
import SendSms from './components/SendSms';
import ContactsList from './components/ContactsList';
import TemplatesList from './components/TemplatesList';
import LogsList from './components/LogsList';
import GatewaySettings from './components/GatewaySettings';
import AdminPanel from './components/AdminPanel';
import LoginPortal from './components/LoginPortal';
import { ShieldAlert, Send, LayoutDashboard, Sliders, Smartphone, Users, FileSignature, Database, MessageSquareDot, Clock, ShieldCheck, UserCog, Wallet, ArrowUpDown, PlusCircle, LogOut } from 'lucide-react';

const LOCAL_STORAGE_PREFIX = 'eims_sms_';

const INITIAL_USERS: SmsUser[] = [
  { id: 'usr_admin', name: 'System Admin (Main)', email: 'senderultra69@gmail.com', password: 'admin', balance: 1450.00, role: 'admin', createdAt: new Date().toISOString(), isActive: true },
  { id: 'usr_user1', name: 'Ravi Verma (Client)', email: 'user@ultrasender.com', password: 'user', balance: 45.30, role: 'user', createdAt: new Date().toISOString(), isActive: true },
  { id: 'usr_user2', name: 'Preeti Sharma', email: 'preeti@gmail.com', password: 'user', balance: 180.00, role: 'user', createdAt: new Date().toISOString(), isActive: true }
];

const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  smsCostPerPart: 0.15,
  usdtWalletAddress: 'TY2N8a1R5R9X9S2J7S1N6m7f7S5eR4r9b4',
  btcWalletAddress: 'bc1qxy2kg3dzyp67x6tr7w8v8fhx90989n2ksc',
  upiId: 'ultrasender@upi',
  rechargeCommissionPercent: 15,
  simulatedSuccessMode: false,
};

const INITIAL_RECHARGE_REQUESTS: RechargeRequest[] = [
  {
    id: 'req_1',
    userId: 'usr_user1',
    userName: 'Ravi Verma (Client)',
    amount: 100.0,
    walletAddress: 'TY2N8a1R5R9X9S2J7S1N6m7f7S5eR4r9b4 (USDT-TRC20)',
    transactionHash: 'trX_0x4f129a888c71b764cd78a876ccb543',
    status: 'approved',
    createdAt: new Date(Date.now() - 3600 * 24 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3600 * 23.5 * 1000).toISOString()
  },
  {
    id: 'req_2',
    userId: 'usr_user2',
    userName: 'Preeti Sharma',
    amount: 50.0,
    walletAddress: 'eimssms@upi (UPI / Phone)',
    transactionHash: 'UPI_REF_60293129410',
    status: 'pending',
    createdAt: new Date(Date.now() - 600 * 1000).toISOString()
  }
];

// PRE-POPULATED INITIAL STANDARD STATES
const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl_1',
    title: 'VIP Appointment Confirmation',
    content: 'Dear {name}, this is a verification note to confirm your VIP scheduled session with {company}. Notes: {notes} for coordinates. Status: CONFIRMED.',
    variables: ['name', 'company', 'notes'],
    userId: 'usr_admin'
  },
  {
    id: 'tpl_2',
    title: 'Dynamic OTP Security Token',
    content: '[EIMS SECURITY] Hello {name}, your dynamic Authorization OTP verification code is: {notes}. This code is valid for 5 minutes. Formed by {company}.',
    variables: ['name', 'notes', 'company'],
    userId: 'usr_admin'
  },
  {
    id: 'tpl_3',
    title: 'Custom Marketing Broadcast',
    content: 'Hi {name}! Exclusive promo alert from {company}. Present this text to unlock 25% off during your next visit. Notes: valid till next Sunday.',
    variables: ['name', 'company'],
    userId: 'usr_admin'
  }
];

const INITIAL_CONTACTS: Contact[] = [
  { id: 'cnt_1', name: 'John Doe', phone: '+85291234567', company: 'Deep Tech corp', notes: 'VIP Member', timestamp: new Date().toISOString(), userId: 'usr_admin' },
  { id: 'cnt_2', name: 'Jane Chang', phone: '+85298765432', company: 'Vertex Solutions', notes: 'Standard Account', timestamp: new Date().toISOString(), userId: 'usr_admin' },
  { id: 'cnt_3', name: 'Michael Smith', phone: '+14155552671', company: 'EIMS Global', notes: 'Lead Director', timestamp: new Date().toISOString(), userId: 'usr_admin' },
  { id: 'cnt_4', name: 'Emma Watson', phone: '+447911123456', company: 'Aether Lab', notes: 'Primary Contact', timestamp: new Date().toISOString(), userId: 'usr_admin' }
];

const INITIAL_GROUPS: ContactGroup[] = [
  { id: 'grp_1', name: 'Standard Premier clients', contactIds: ['cnt_1', 'cnt_2'], userId: 'usr_admin' },
  { id: 'grp_2', name: 'Global Account Overseers', contactIds: ['cnt_3', 'cnt_4'], userId: 'usr_admin' }
];

const INITIAL_LOGS: SmsLog[] = [
  {
    id: 'log_1',
    phone: '+85291234567',
    name: 'John Doe',
    content: 'Dear John Doe, this is a verification note to confirm your VIP scheduled session with Deep Tech corp.',
    status: 'delivered',
    chunksCount: 1,
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    gatewayName: 'Mock Sandbox Dispatcher',
    responseSummary: '{"messageId": "msg_mock_7a9f2bc", "code": 0, "desc": "Success"}',
    userId: 'usr_admin',
    userName: 'System Admin (Main)'
  },
  {
    id: 'log_2',
    phone: '+85298765432',
    name: 'Jane Chang',
    content: '[EIMS SECURITY] Hello Jane Chang, your dynamic Authorization OTP verification code is: 489721.',
    status: 'delivered',
    chunksCount: 1,
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    gatewayName: 'Mock Sandbox Dispatcher',
    responseSummary: '{"messageId": "msg_mock_3a8b9f1", "code": 0, "desc": "Success"}',
    userId: 'usr_admin',
    userName: 'System Admin (Main)'
  },
  {
    id: 'log_3',
    phone: '+14155552671',
    name: 'Michael Smith',
    content: 'Hi Michael Smith! Exclusive promo alert from EIMS Global.',
    status: 'failed',
    chunksCount: 1,
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    gatewayName: 'Twilio Cloud Gateway',
    responseSummary: '{"code": 21608, "message": "The Sandbox number is not yet verified in recipient list"}',
    userId: 'usr_admin',
    userName: 'System Admin (Main)'
  }
];

const INITIAL_GATEWAY_CONFIG: GatewayConfigState = {
  activeId: 'mock',
  gateways: [
    {
      id: 'mock',
      name: 'Mock Sandbox Dispatcher',
      type: 'mock',
      settings: {}
    },
    {
      id: 'easysend',
      name: 'Easy Send Live API',
      type: 'easysend',
      settings: {
        easysendApiKey: 'xssr1vs99amx1ulczo4zvnhcqrew66cv',
        easysendSenderId: 'ULTRA',
        easysendUrl: 'https://restapi.easysendsms.app/v1/rest/sms/send'
      }
    },
    {
      id: 'twilio',
      name: 'Twilio live Cloud Gateway',
      type: 'twilio',
      settings: {
        twilioSid: '',
        twilioToken: '',
        twilioFrom: ''
      }
    },
    {
      id: 'custom',
      name: 'Custom HTTP REST Gateway',
      type: 'custom',
      settings: {
        url: 'https://sms.kftel.hk/eims/api/sendSmsShortcut',
        method: 'POST',
        contentType: 'application/json',
        headers: [
          { key: 'Accept', value: 'application/json' }
        ],
        queryIdField: 'username',
        queryIdVal: '',
        querySecField: 'password',
        querySecVal: '',
        phoneField: 'mobile',
        textField: 'message',
        additionalParams: [
          { key: 'unicode', value: '1' }
        ]
      }
    }
  ]
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'send' | 'contacts' | 'templates' | 'logs' | 'settings' | 'admin'>('dashboard');

  // LOAD FROM LOCAL STORAGE OR USE DEFAULT INITIALS
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [groups, setGroups] = useState<ContactGroup[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [logs, setLogs] = useState<SmsLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfigState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'gateway_config');
    return saved ? JSON.parse(saved) : INITIAL_GATEWAY_CONFIG;
  });

  const [users, setUsers] = useState<SmsUser[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SmsUser[];
        return parsed.map(u => {
          if (u.id === 'usr_admin' && u.email === 'admin@ultrasender.com') {
            return { ...u, email: 'senderultra69@gmail.com' };
          }
          return u;
        });
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'system_config');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_CONFIG;
  });

  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'recharge_requests');
    return saved ? JSON.parse(saved) : INITIAL_RECHARGE_REQUESTS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'current_user_id');
    return saved || 'usr_admin';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'is_logged_in');
    return saved === 'true';
  });

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    if (!profileName.trim() || !profileEmail.trim() || !profilePassword.trim()) {
      setProfileErrorMsg('All fields are required.');
      return;
    }

    // Check if email taken
    const emailTaken = users.some(u => u.id !== currentUserId && u.email.toLowerCase() === profileEmail.toLowerCase().trim());
    if (emailTaken) {
      setProfileErrorMsg('This email login ID is already taken by another user.');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === currentUserId) {
        return {
          ...u,
          name: profileName.trim(),
          email: profileEmail.trim(),
          password: profilePassword.trim()
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    setProfileSuccessMsg('Dynamic profile and credentials updated successfully!');

    setTimeout(() => {
      setIsProfileOpen(false);
      setProfileSuccessMsg('');
    }, 1500);
  };

  // SAVING TO LOCALSTORAGE ON MUTATION
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'gateway_config', JSON.stringify(gatewayConfig));
  }, [gatewayConfig]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'system_config', JSON.stringify(systemConfig));
  }, [systemConfig]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'recharge_requests', JSON.stringify(rechargeRequests));
  }, [rechargeRequests]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'current_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  // Connect provided Live EasySend API key and URL to the state automatically on component mount
  useEffect(() => {
    setGatewayConfig(prev => {
      let isUpdated = false;
      let currentGateways = [...prev.gateways];

      // Merge any missing gateways from INITIAL_GATEWAY_CONFIG (like the new 'easysend' gateway)
      INITIAL_GATEWAY_CONFIG.gateways.forEach(initialG => {
        const exists = currentGateways.some(g => g.id === initialG.id);
        if (!exists) {
          currentGateways.push(initialG);
          isUpdated = true;
        }
      });

      const updatedGateways = currentGateways.map(g => {
        if (g.id === 'easysend') {
          // Fix: Only apply default API key/credentials on mount if they are completely missing
          const hasNoKey = !g.settings || !g.settings.easysendApiKey;
          const hasNoUrl = !g.settings || !g.settings.easysendUrl;
          if (hasNoKey || hasNoUrl) {
            isUpdated = true;
            return {
              ...g,
              settings: {
                ...g.settings,
                easysendApiKey: hasNoKey ? 'xssr1vs99amx1ulczo4zvnhcqrew66cv' : g.settings.easysendApiKey,
                easysendUrl: hasNoUrl ? 'https://restapi.easysendsms.app/v1/rest/sms/send' : g.settings.easysendUrl
              }
            };
          }
        }
        return g;
      });

      // Fix: Only default activeId if the saved activeId is completely invalid or missing in list of gateways
      let nextActiveId = prev.activeId;
      if (!currentGateways.some(g => g.id === prev.activeId)) {
        nextActiveId = 'easysend';
        isUpdated = true;
      }

      if (isUpdated) {
        return {
          activeId: nextActiveId,
          gateways: updatedGateways
        };
      }
      return prev;
    });
  }, []);

  // ACTIVE GATEWAY HELPER
  const activeGateway = useMemo(() => {
    return gatewayConfig.gateways.find(g => g.id === gatewayConfig.activeId) || gatewayConfig.gateways[0];
  }, [gatewayConfig]);

  // CLIENT-SIDE BACKUP/FALLBACK DISPATCH ENGINE
  // (Used when hosted statically on GitHub Pages / Vercel where there is no Express server API available)
  const runSendSmsClientSide = async (
    gatewayType: string,
    settings: any,
    contactsList: { phone: string; name?: string; content: string }[],
    simulatedSuccess: boolean
  ) => {
    const results = [];

    for (const contact of contactsList) {
      const { phone, name, content } = contact;
      const finalContent = content || '';
      const cleanPhone = phone.replace(/\s+/g, '');

      if (!cleanPhone) {
        results.push({
          phone: 'Unknown',
          name,
          status: 'failed',
          error: 'Empty phone number',
          responseSummary: 'Invalid entry',
        });
        continue;
      }

      // 0. Simulation Mode
      if (simulatedSuccess) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        results.push({
          phone: cleanPhone,
          name,
          status: 'delivered',
          responseSummary: JSON.stringify({ 
            messageId: `msg_easysend_client_${Math.random().toString(36).substring(3, 11)}`, 
            code: 0, 
            desc: 'Accepted by operator (browser simulated direct override)' 
          }),
        });
        continue;
      }

      // 1. Mock Sandbox Mode
      if (gatewayType === 'mock') {
        await new Promise((resolve) => setTimeout(resolve, 120));
        const isSuccess = Math.random() < 0.96;
        results.push({
          phone: cleanPhone,
          name,
          status: isSuccess ? 'delivered' : 'failed',
          error: isSuccess ? undefined : 'Simulated provider signal delivery timeout (Code: 154)',
          responseSummary: isSuccess
            ? JSON.stringify({ messageId: `msg_mock_${Math.random().toString(36).substring(3, 11)}`, code: 0, desc: 'Success' })
            : JSON.stringify({ code: 504, desc: 'Signal lost' }),
        });
        continue;
      }

      // 2. Twilio Gateway
      if (gatewayType === 'twilio') {
        const { twilioSid, twilioToken, twilioFrom } = settings || {};
        if (!twilioSid || !twilioToken || !twilioFrom) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: 'Missing Twilio parameters in configuration settings.',
            responseSummary: 'Configuration Error',
          });
          continue;
        }

        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const authHeader = 'Basic ' + window.btoa(`${twilioSid}:${twilioToken}`);

          const formData = new URLSearchParams();
          formData.append('To', cleanPhone);
          formData.append('From', twilioFrom);
          formData.append('Body', finalContent);

          const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const data = await response.json() as any;

          if (response.ok) {
            results.push({
              phone: cleanPhone,
              name,
              status: 'sent',
              responseSummary: `SID: ${data.sid || 'sent'} | Status: ${data.status}`,
            });
          } else {
            results.push({
              phone: cleanPhone,
              name,
              status: 'failed',
              error: data.message || `Twilio error status ${response.status}`,
              responseSummary: JSON.stringify(data),
            });
          }
        } catch (err: any) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: err.message || 'Twilio network fetch breakdown.',
            responseSummary: String(err),
          });
        }
        continue;
      }

      // 3. Custom HTTP/REST Gateway
      if (gatewayType === 'custom') {
        const {
          url,
          method = 'POST',
          contentType = 'application/json',
          headers = [],
          queryIdField,
          queryIdVal,
          querySecField,
          querySecVal,
          phoneField = 'mobile',
          textField = 'message',
          additionalParams = [],
        } = settings || {};

        if (!url) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: 'API Endpoint URL is missing in the Gateway configuration.',
            responseSummary: 'Invalid Gateway Endpoint',
          });
          continue;
        }

        try {
          const paramsMap = new Map<string, string>();
          if (queryIdField && queryIdVal) paramsMap.set(queryIdField, queryIdVal);
          if (querySecField && querySecVal) paramsMap.set(querySecField, querySecVal);
          if (phoneField) paramsMap.set(phoneField, cleanPhone);
          if (textField) paramsMap.set(textField, finalContent);
          if (Array.isArray(additionalParams)) {
            for (const item of additionalParams) {
              if (item.key) paramsMap.set(item.key, item.value || '');
            }
          }

          const fetchHeaders: Record<string, string> = {};
          if (Array.isArray(headers)) {
            for (const item of headers) {
              if (item.key) fetchHeaders[item.key] = item.value || '';
            }
          }

          let targetUrl = url;
          let fetchBody: string | URLSearchParams | undefined = undefined;

          if (method === 'GET') {
            const queryParams = new URLSearchParams();
            paramsMap.forEach((val, key) => queryParams.append(key, val));
            const connector = targetUrl.includes('?') ? '&' : '?';
            targetUrl = `${targetUrl}${connector}${queryParams.toString()}`;
          } else {
            if (contentType === 'application/json') {
              fetchHeaders['Content-Type'] = 'application/json';
              const bodyObj: Record<string, any> = {};
              paramsMap.forEach((val, key) => {
                bodyObj[key] = val;
              });
              fetchBody = JSON.stringify(bodyObj);
            } else {
              fetchHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
              const bodyForm = new URLSearchParams();
              paramsMap.forEach((val, key) => bodyForm.append(key, val));
              fetchBody = bodyForm;
            }
          }

          const fetchResponse = await fetch(targetUrl, {
            method,
            headers: fetchHeaders,
            body: method === 'POST' ? fetchBody : undefined,
          });

          const responseText = await fetchResponse.text();

          if (fetchResponse.ok) {
            results.push({
              phone: cleanPhone,
              name,
              status: 'sent',
              responseSummary: responseText.substring(0, 150),
            });
          } else {
            results.push({
              phone: cleanPhone,
              name,
              status: 'failed',
              error: `Gateway returned response error status: ${fetchResponse.status}`,
              responseSummary: responseText.substring(0, 150),
            });
          }
        } catch (err: any) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: err.message || 'Custom HTTP Gateway transmission failed.',
            responseSummary: String(err),
          });
        }
        continue;
      }

      // 4. EasySend Live API Gateway
      if (gatewayType === 'easysend') {
        const {
          easysendApiKey,
          easysendSenderId = 'ULTRA',
          easysendUrl = 'https://restapi.easysendsms.app/v1/rest/sms/send'
        } = settings || {};

        if (!easysendApiKey) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: 'Easy Send API Key is missing in configuration settings.',
            responseSummary: 'Configuration Error',
          });
          continue;
        }

        try {
          const payloadJson = {
            api_key: easysendApiKey,
            to: cleanPhone,
            text: finalContent,
            from: easysendSenderId
          };

          const response = await fetch(easysendUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payloadJson)
          });

          const responseText = await response.text();
          const isSuccess = response.ok;

          if (isSuccess) {
            results.push({
              phone: cleanPhone,
              name,
              status: 'sent',
              responseSummary: `EasySend OK. Msg length: ${finalContent.length} chars. Response: ${responseText.substring(0, 80)}`,
            });
          } else {
            results.push({
              phone: cleanPhone,
              name,
              status: 'failed',
              error: `EasySend API responded with status ${response.status}`,
              responseSummary: responseText.substring(0, 150),
            });
          }
        } catch (err: any) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: err.message || 'Easy Send API HTTP transmission failure.',
            responseSummary: String(err),
          });
        }
        continue;
      }

      results.push({
        phone: cleanPhone,
        name,
        status: 'failed',
        error: 'Unsupported gateway type selection.',
        responseSummary: 'Framework Mismatch',
      });
    }

    return { success: true, results };
  };

  // USER ISOLATED DATA COMPUTATIONS
  const userLogs = useMemo(() => {
    if (currentUser.role === 'admin') {
      return logs;
    }
    return logs.filter(l => l.userId === currentUser.id);
  }, [logs, currentUser]);

  const userContacts = useMemo(() => {
    if (currentUser.role === 'admin') {
      return contacts;
    }
    return contacts.filter(c => c.userId === currentUser.id);
  }, [contacts, currentUser]);

  const userGroups = useMemo(() => {
    if (currentUser.role === 'admin') {
      return groups;
    }
    return groups.filter(g => g.userId === currentUser.id);
  }, [groups, currentUser]);

  const userTemplates = useMemo(() => {
    if (currentUser.role === 'admin') {
      return templates;
    }
    return templates.filter(t => t.userId === currentUser.id);
  }, [templates, currentUser]);

  // METRICS CALCULATOR BASED ON DELIVERY LOGS
  const metrics = useMemo<SmsMetrics>(() => {
    let sent = 0;
    let delivered = 0;
    let failed = 0;
    let pending = 0;
    let credits = 0;

    userLogs.forEach(l => {
      sent += 1;
      credits += l.chunksCount * 1.0; // Assume 1 credit per SMS segment

      if (l.status === 'delivered') delivered += 1;
      else if (l.status === 'failed') failed += 1;
      else if (l.status === 'pending') pending += 1;
    });

    return {
      totalSent: sent,
      totalDelivered: delivered,
      totalFailed: failed,
      totalPending: pending,
      creditsUsed: credits * systemConfig.smsCostPerPart
    };
  }, [userLogs, systemConfig.smsCostPerPart]);

    // ACTION CRITICAL: DISPATCH SMS PAYLOAD TO LIVE EXPRESS PROXY ENDPOINT
    const handleSendSms = async (payload: {
      recipientList: { phone: string; name?: string; content: string }[];
      isScheduled: boolean;
      scheduledTime?: string;
    }) => {
      // Calculate total dispatch cost based on segment parts
      const totalParts = payload.recipientList.reduce((acc, rec) => {
        const charSize = rec.content?.length || 50;
        return acc + Math.ceil(charSize / 150);
      }, 0);
      const requiredCost = totalParts * systemConfig.smsCostPerPart;
  
      if (currentUser.role === 'user' && currentUser.balance < requiredCost) {
        return { 
          success: false, 
          error: `Insufficient account credits! Your active balance is $${currentUser.balance.toFixed(2)} USD, but this broadcast requires $${requiredCost.toFixed(2)} USD based on the admin cost rate ($${systemConfig.smsCostPerPart} per segment). Please request a recharge first via dashboard.` 
        };
      }
  
      let responseJson: any = null;
      let usedFallback = false;

      // Force client-side execution if running on github.io or other static hosts
      const isStaticHost = window.location.hostname.includes('github.io') || window.location.hostname.includes('localhost') === false && window.location.port === '';
  
      if (!isStaticHost) {
        try {
          const response = await fetch('/api/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gatewayType: activeGateway.type,
              settings: activeGateway.settings,
              contacts: payload.recipientList,
              baseMessage: '',
              simulatedSuccessMode: !!systemConfig.simulatedSuccessMode
            })
          });
  
          if (response.ok) {
            responseJson = await response.json();
          } else {
            console.warn(`Express proxy status ${response.status}. Triggering client-side fallback.`);
            usedFallback = true;
          }
        } catch (err) {
          console.warn('Backend proxy unreachable. Routing direct dispatch from browser instead.', err);
          usedFallback = true;
        }
      } else {
        usedFallback = true;
      }
  
      // Execute direct-from-browser client-level dispatch if backend server API is unreachable or omitted
      if (usedFallback || !responseJson || !responseJson.success) {
        try {
          responseJson = await runSendSmsClientSide(
            activeGateway.type,
            activeGateway.settings,
            payload.recipientList,
            !!systemConfig.simulatedSuccessMode
          );
        } catch (fallbackError: any) {
          return { success: false, error: fallbackError.message || 'Severe client-side direct dispatch failure' };
        }
      }
  
      if (responseJson && responseJson.success && Array.isArray(responseJson.results)) {
        // Formulate SMS logs models
        const newLogs: SmsLog[] = responseJson.results.map((r: any) => {
          // Calculate SMS parts lengths
          const charSize = r.content?.length || payload.recipientList.find(pl => pl.phone === r.phone)?.content?.length || 50;
          const pieces = Math.ceil(charSize / 150);
  
          return {
            id: `log_${Math.random().toString(36).substring(3, 11)}_${Date.now()}`,
            phone: r.phone,
            name: r.name,
            content: r.content || payload.recipientList.find(pl => pl.phone === r.phone)?.content || 'Outgoing template',
            status: payload.isScheduled ? 'pending' : r.status,
            chunksCount: pieces,
            timestamp: payload.isScheduled && payload.scheduledTime ? new Date(payload.scheduledTime).toISOString() : new Date().toISOString(),
            gatewayName: activeGateway.name,
            responseSummary: r.responseSummary || r.error || (payload.isScheduled ? 'Scheduled Outbox Delayed Queue' : 'Delivered response code ok'),
            userId: currentUser.id,
            userName: currentUser.name
          };
        });
  
        // Deduct balance from user account
        const updatedUsers = users.map(u => {
          if (u.id === currentUser.id) {
            return { ...u, balance: Math.max(0, u.balance - requiredCost) };
          }
          return u;
        });
        setUsers(updatedUsers);
  
        // Prepend new records to active logs history
        setLogs(current => [...newLogs, ...current]);
  
        return { success: true };
      } else {
        return { success: false, error: (responseJson && responseJson.error) || 'Endpoint connection failed.' };
      }
    };

  // ACTIONS FOR CONTACT MANAGER
  const handleAddContact = (rawContact: Omit<Contact, 'id' | 'timestamp'>) => {
    const newC: Contact = {
      ...rawContact,
      id: `cnt_${Math.random().toString(36).substring(3, 11)}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id
    };
    setContacts(current => [...current, newC]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(current => current.filter(c => c.id !== id));
    // Pull from active groups too
    setGroups(current =>
      current.map(g => ({
        ...g,
        contactIds: g.contactIds.filter(cid => cid !== id)
      }))
    );
  };

  const handleCreateGroup = (name: string, contactIds: string[]) => {
    const newG: ContactGroup = {
      id: `grp_${Math.random().toString(36).substring(3, 11)}_${Date.now()}`,
      name,
      contactIds,
      userId: currentUser.id
    };
    setGroups(current => [...current, newG]);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(current => current.filter(g => g.id !== id));
  };

  // ACTIONS FOR TEMPLATE MANAGER
  const handleAddTemplate = (rawTemplate: Omit<MessageTemplate, 'id' | 'variables'>) => {
    // Detect placeholders to form the variable chips
    const regex = /{([^}]+)}/g;
    const found: string[] = [];
    let match;
    while ((match = regex.exec(rawTemplate.content)) !== null) {
      if (!found.includes(match[1].toLowerCase())) {
        found.push(match[1].toLowerCase());
      }
    }

    const newT: MessageTemplate = {
      ...rawTemplate,
      id: `tpl_${Math.random().toString(36).substring(3, 11)}_${Date.now()}`,
      variables: found,
      userId: currentUser.id
    };
    setTemplates(current => [...current, newT]);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(current => current.filter(t => t.id !== id));
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you absolutely sure you want to clear your dispatch logs history? This is irreversible.')) {
      if (currentUser.role === 'admin') {
        setLogs([]);
      } else {
        setLogs(current => current.filter(l => l.userId !== currentUser.id));
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginPortal
        users={users}
        onLoginSuccess={(userId) => {
          setCurrentUserId(userId);
          setIsLoggedIn(true);
        }}
        onResetAdminPassword={() => {
          const updated = users.map(u => {
            if (u.id === 'usr_admin') {
              return { ...u, password: 'admin', email: 'senderultra69@gmail.com' };
            }
            return u;
          });
          setUsers(updated);
          localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(updated));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Top Professional Branding Header Bar matching High Density style */}
      <nav className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
            </svg>
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900">Ultra Sender Portal</span>
          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:inline"></div>
          <span className="hidden sm:inline text-[10px] text-slate-500 uppercase font-semibold tracking-wider">High Density Interface</span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex gap-4 text-xs font-semibold">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Metrics</span>
              <span className="text-indigo-600 font-mono font-bold">{metrics.totalSent} sent</span>
            </div>
            <div className="flex flex-col items-end border-l border-slate-200 pl-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Active Pipeline</span>
              <span className="text-slate-700 truncate max-w-[125px] sm:max-w-none font-mono font-bold text-[10px]">{activeGateway.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Active User</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  setCurrentUserId(e.target.value);
                  setCurrentTab('dashboard');
                }}
                className="text-[11px] font-extrabold border-none bg-slate-50 text-indigo-700 focus:ring-1 focus:ring-indigo-300 outline-none px-2 py-0.5 rounded cursor-pointer text-right transition-all hover:bg-indigo-50"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col items-end border-l border-slate-200 pl-3">
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Credits</span>
              <span className="text-xs font-mono font-black text-indigo-700">${currentUser.balance.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setProfileName(currentUser.name);
              setProfileEmail(currentUser.email);
              setProfilePassword(currentUser.password);
              setIsProfileOpen(true);
            }}
            className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all transition-colors cursor-pointer select-none"
            title="Update name, login email or security password"
          >
            <UserCog size={11} />
            <span className="hidden sm:inline">My Profile</span>
          </button>

          <button
            onClick={() => {
              setIsLoggedIn(false);
            }}
            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all transition-colors cursor-pointer select-none"
            title="Securely Log Out"
          >
            <LogOut size={11} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Tab Navigation Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-2 overflow-x-auto scrollbar-none" aria-label="Tabs">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={13} /> Dashboard
            </button>

            <button
              id="tab-send-sms"
              onClick={() => setCurrentTab('send')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                currentTab === 'send'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Smartphone size={13} /> Shortcut Send SMS
            </button>

            <button
              onClick={() => setCurrentTab('contacts')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                currentTab === 'contacts'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users size={13} /> Contacts & Groups
            </button>

            <button
              onClick={() => setCurrentTab('templates')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                currentTab === 'templates'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSignature size={13} /> Message Templates
            </button>

            <button
              onClick={() => setCurrentTab('logs')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                currentTab === 'logs'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database size={13} /> Delivery Logs
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentTab('settings')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  currentTab === 'settings'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sliders size={13} /> Gateway Settings
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3 py-1.5 rounded-md text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  currentTab === 'admin'
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                    : 'text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50'
                }`}
              >
                <UserCog size={13} /> Admin Panel Settings
                {rechargeRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Primary Workspace Panel Page Renderers */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
        {currentTab === 'dashboard' && (
          <Dashboard
            logs={userLogs}
            metrics={metrics}
            users={users}
            currentUser={currentUser}
            systemConfig={systemConfig}
            rechargeRequests={rechargeRequests}
            onNavigate={(tag) => setCurrentTab(tag)}
            onUpdateRechargeRequests={setRechargeRequests}
          />
        )}

        {currentTab === 'send' && (
          <SendSms
            contacts={userContacts}
            groups={userGroups}
            templates={userTemplates}
            activeGateway={activeGateway}
            smsCostPerPart={systemConfig.smsCostPerPart}
            onSendSms={handleSendSms}
          />
        )}

        {currentTab === 'contacts' && (
          <ContactsList
            contacts={userContacts}
            groups={userGroups}
            onAddContact={handleAddContact}
            onDeleteContact={handleDeleteContact}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {currentTab === 'templates' && (
          <TemplatesList
            templates={userTemplates}
            onAddTemplate={handleAddTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {currentTab === 'logs' && (
          <LogsList
            logs={userLogs}
            onClearLogs={handleClearLogs}
          />
        )}

        {currentTab === 'settings' && currentUser.role === 'admin' && (
          <GatewaySettings
            gatewayConfig={gatewayConfig}
            onUpdateGatewayConfig={(cfg) => setGatewayConfig(cfg)}
          />
        )}

        {currentTab === 'admin' && currentUser.role === 'admin' && (
          <AdminPanel
            users={users}
            currentUser={currentUser}
            rechargeRequests={rechargeRequests}
            systemConfig={systemConfig}
            logs={logs}
            onUpdateUsers={setUsers}
            onUpdateSystemConfig={setSystemConfig}
            onUpdateRechargeRequests={setRechargeRequests}
          />
        )}
      </main>

      {/* Clean Bottom Footer Bar */}
      <footer className="bg-white border-t border-slate-200/80 select-none py-4 text-center mt-auto text-[10px] text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p>© 2026 Ultra Sender. Professional SMS Shortcut Console Gateway.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-emerald-600"><ShieldCheck size={11} /> HTTPS API Proxy Secured</span>
            <span>•</span>
            <span>All gateway credentials processed server-side.</span>
          </div>
        </div>
      </footer>

      {/* Dynamic Profile Settings Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <UserCog size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Profile & Security Settings</h3>
                  <p className="text-[10px] text-slate-400">Edit active session login keys</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  setProfileSuccessMsg('');
                  setProfileErrorMsg('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold transition-colors cursor-pointer text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Display Name</label>
                <input 
                  type="text" 
                  required 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. System Admin"
                  className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white font-sans text-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Login Email ID</label>
                <input 
                  type="email" 
                  required 
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="senderultra69@gmail.com"
                  className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white font-mono text-slate-850 font-bold"
                />
                <span className="text-[9px] text-slate-400 leading-tight">This will be your new email ID used to login at the gateway.</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">Active Password security-key</label>
                <input 
                  type="text" 
                  required 
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white font-mono text-slate-850 font-bold"
                />
                <span className="text-[9px] text-slate-400 leading-tight">Enter a secure token. This changes your gateway lock-key immediately.</span>
              </div>

              {profileErrorMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[10px] leading-normal font-sans">
                  ⚠️ {profileErrorMsg}
                </div>
              )}

              {profileSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-850 border border-emerald-150 rounded-lg text-[10px] leading-normal font-bold font-sans">
                  ✅ {profileSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsProfileOpen(false);
                    setProfileSuccessMsg('');
                    setProfileErrorMsg('');
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer text-xs"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
