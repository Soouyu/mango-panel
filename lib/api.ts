import { getToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  return request<{ token: string; user: Record<string, string> }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export async function getStats() {
  return request<{ data: DashboardStats }>('/api/dashboard/stats')
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export async function getLeads(offset = 0) {
  return request<{ data: Lead[] }>(`/api/leads?limit=20&offset=${offset}`)
}

export async function getLead(id: string) {
  return request<{ data: Lead }>(`/api/leads/${id}`)
}

// ── Conversations ─────────────────────────────────────────────────────────────
export async function getConversations(status?: string) {
  const q = status ? `?status=${status}` : ''
  return request<{ data: Conversation[] }>(`/api/conversations${q}`)
}

export async function getConversation(id: string) {
  return request<{ data: Conversation }>(`/api/conversations/${id}`)
}

export async function takeoverConversation(id: string) {
  return request(`/api/conversations/${id}/takeover`, { method: 'POST' })
}

export async function releaseConversation(id: string) {
  return request(`/api/conversations/${id}/release`, { method: 'POST' })
}

export async function sendMessage(id: string, message: string) {
  return request(`/api/conversations/${id}/message`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

// ── Channels ──────────────────────────────────────────────────────────────────
export async function getChannels() {
  return request<{ data: Channel[] }>('/api/channels')
}

export async function getChannel(id: string) {
  return request<{ data: Channel }>(`/api/channels/${id}`)
}

export async function saveFlowDefinition(channelId: string, flow: FlowDefinition) {
  return request(`/api/channels/${channelId}/flow`, {
    method: 'PUT',
    body: JSON.stringify({ flow_definition: flow }),
  })
}

export async function saveBotConfig(channelId: string, config: Partial<BotConfig>) {
  return request(`/api/channels/${channelId}/config`, {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DashboardStats {
  leads:         { total: number; thisMonth: number; fullProfile: number }
  conversations: { total: number; active: number; takeover: number; done: number }
  contacts:      { total: number; thisMonth: number }
}

export interface Lead {
  id:               string
  phone?:           string
  name?:            string
  business?:        string
  need?:            string
  timeline?:        string
  budget?:          string
  language:         string
  fields_count:     number
  all_fields_filled: boolean
  captured_at:      string
  contacts?:        { external_id: string; name: string }
  conversations?:   { mode: string; history: Message[]; status: string }
}

export interface Conversation {
  id:                 string
  status:             'active' | 'done' | 'takeover' | 'closed'
  mode:               string
  language:           string
  profile:            Record<string, string | null>
  history:            Message[]
  last_activity:      string
  created_at:         string
  contacts?:          { external_id: string; name: string | null }
  messages?:          Message[]
}

export interface Message {
  id?:         string
  role:        'user' | 'assistant' | 'human'
  content:     string
  created_at?: string
}

export interface Channel {
  id:              string
  org_id:          string
  type:            'whatsapp' | 'instagram' | 'facebook'
  name:            string
  identifier:      string
  phone_number_id?: string
  status:          'active' | 'inactive'
  created_at:      string
  bot_config?:     BotConfig
}

export interface BotConfig {
  id:             string
  channel_id:     string
  bot_type:       'flow' | 'agent' | 'dual'
  persona_name:   string
  business_name:  string
  system_prompt?: string
  services?:      { name: string; price: string; description: string }[]
  timezone:       string
  business_hours: { days: number[]; start: number; end: number }
  language:       string
  flow_definition?: FlowDefinition
}

export interface FlowDefinition {
  nodes: FlowNodeDef[]
  edges: FlowEdgeDef[]
}

export interface FlowNodeDef {
  id:       string
  type:     string
  position: { x: number; y: number }
  data:     Record<string, unknown>
}

export interface FlowEdgeDef {
  id:            string
  source:        string
  target:        string
  sourceHandle?: string | null
  targetHandle?: string | null
}
