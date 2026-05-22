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
