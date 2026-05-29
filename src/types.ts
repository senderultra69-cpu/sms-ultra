export interface Contact {
  id: string;
  name: string;
  phone: string;
  company?: string;
  notes?: string;
  timestamp: string;
  userId?: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  contactIds: string[];
  userId?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  variables: string[];
  userId?: string;
}

export type SmsStatus = 'sent' | 'pending' | 'delivered' | 'failed';

export interface SmsLog {
  id: string;
  phone: string;
  name?: string;
  content: string;
  status: SmsStatus;
  chunksCount: number;
  timestamp: string;
  gatewayName: string;
  responseSummary?: string;
  userId?: string;
  userName?: string;
}

export type GatewayType = 'mock' | 'twilio' | 'custom' | 'easysend';

export interface CustomHeader {
  key: string;
  value: string;
}

export interface CustomParam {
  key: string;
  value: string;
}

export interface GatewaySettings {
  // Twilio settings
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;

  // Custom HTTP settings
  url?: string;
  method?: 'GET' | 'POST';
  contentType?: 'application/json' | 'application/x-www-form-urlencoded';
  headers?: CustomHeader[];
  queryIdField?: string;  // Username/API Key query parameter name
  queryIdVal?: string;
  querySecField?: string; // Private key/Password query parameter name
  querySecVal?: string;
  phoneField?: string;    // Request parameter for phone (e.g., 'mobile', 'to')
  textField?: string;     // Request parameter for SMS content (e.g., 'message', 'text')
  additionalParams?: CustomParam[]; // Custom fields like senderId=123, unicode=1

  // Esay Send Settings
  easysendApiKey?: string;
  easysendSenderId?: string;
  easysendUrl?: string;
}

export interface Gateway {
  id: string;
  name: string;
  type: GatewayType;
  settings: GatewaySettings;
}

export interface GatewayConfigState {
  activeId: string;
  gateways: Gateway[];
}

export interface SmsMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalPending: number;
  creditsUsed: number;
}

export interface SmsUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  balance: number;
  role: 'admin' | 'user';
  createdAt: string;
  isActive: boolean;
}

export type RechargeStatus = 'pending' | 'approved' | 'rejected';

export interface RechargeRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  walletAddress: string;
  transactionHash: string; // Tx hash or payment proof notes
  imageProof?: string; // QR upload base64 image representation
  status: RechargeStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface SystemConfig {
  smsCostPerPart: number; // e.g. 0.1 credits per segment
  btcWalletAddress: string;
  usdtWalletAddress: string;
  upiId: string;
  qrCodeBase64?: string; // Admin uploaded recharge QR code
  rechargeCommissionPercent?: number; // percentage of admin cut
  simulatedSuccessMode?: boolean; // Toggles fake sending mode (pure profit, no real API hit)
}

