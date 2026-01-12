export enum SignalType {
  INTERNAL = 'Internal',
  EXTERNAL = 'External',
  MARKET = 'Market'
}

export enum Sentiment {
  PAIN_POINT = 'Pain Point',
  WIN = 'Win',
  THREAT = 'Threat',
  NEUTRAL = 'Neutral'
}

export enum Urgency {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface RawSignal {
  id: string;
  source: string; // e.g., "Zendesk", "Twitter", "Competitor Blog"
  content: string;
  type: SignalType;
  date: string; // Format: 'September 24, 2026'
  author?: string;
  url?: string;
}

export interface Story {
  id: string;
  narrative: string; // The headline
  summary: string; // Detailed summary
  sentiment: Sentiment;
  urgency: Urgency;
  productArea: string;
  userPersona: string;
  signalStrength: number; // Count of sources
  sourceIds: string[]; // IDs of RawSignals that make up this story
  reasoning?: string; // Why AI grouped these
}

export interface AnalysisStats {
  totalSignals: number;
  totalStories: number;
  sentimentBreakdown: { [key in Sentiment]: number };
  urgencyBreakdown: { [key in Urgency]: number };
}

export enum ScheduleFrequency {
  HOURLY = 'Hourly',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export enum IntegrationMode {
  POLLING = 'Polling',
  WEBHOOK = 'Webhook'
}

export interface IntegrationLog {
  id: string;
  timestamp: string; // Format: 'September 24, 2026 10:00:14 AM'
  status: 'Success' | 'Error';
  itemsCount: number;
  message: string;
  responseSnippet?: string; // First 200 chars of JSON
}

export interface Integration {
  id: string;
  name: string;
  sourceType: string; // e.g., "Jira", "Custom API", "Freshdesk"
  targetSignalType: SignalType; // Internal, External, Market
  mode: IntegrationMode;
  
  // Polling Fields
  url?: string;
  method?: 'GET' | 'POST';
  headers?: string; // JSON string for headers
  payload?: string; // JSON string for body
  schedule?: ScheduleFrequency;
  scheduleTime?: string; // "14:00" (24h format)
  scheduleDayOfWeek?: string; // "Monday", "Tuesday"...
  scheduleDayOfMonth?: number; // 1-31
  
  // Webhook Fields
  webhookUrl?: string; // Generated URL for display
  
  lastRun?: string; // Format: 'September 24, 2026 10:00:14 AM'
  status: 'Active' | 'Inactive' | 'Error';
  logs: IntegrationLog[];
  
  // Config fields
  authType?: 'None' | 'Basic' | 'Bearer';
  apiKey?: string; 
  paginationType?: 'None' | 'Freshdesk_Page_Param';
  templateType?: 'Custom' | 'Freshdesk';
}

export interface WebSource {
  id: string;
  name: string;
  url: string; // The target URL to "monitor" or search about
  targetSignalType: SignalType;
  schedule: ScheduleFrequency;
  scheduleTime?: string;
  scheduleDayOfWeek?: string;
  scheduleDayOfMonth?: number;
  lastRun?: string;
  status: 'Active' | 'Inactive' | 'Error';
  logs: IntegrationLog[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface GlobalSettings {
  productName: string;
  productDescription: string;
}