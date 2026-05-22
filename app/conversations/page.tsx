'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import PageShell from '@/components/PageShell'
import StatusBadge from '@/components/StatusBadge'
import { getConversations, type Conversation } from '@/lib/api'

const TABS = [
  { key: '',         label: 'Todas' },
  { key: 'active',   label: 'Activas' },
  { key: 'takeover', label: 'Takeover' },
  { key: 'done',     label: 'Completadas' },
]

function ConvRow({ conv }: { conv: Conversation }) {
  const name      = conv.contacts?.name || conv.contacts?.external_id || '—'
  const lastMsg   = conv.history?.[conv.history.length - 1]
  const timeAgo   = formatTimeAgo(conv.last_activity)

  return (
    <Link href={`/conversations/${conv.id}`}
      className="flex items-start gap-4 px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors group"
    >
      <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#2a2a2a] flex items-center justify-center text-xs font-600 text-[#888] shrink-0 mt-0.5" style={{ fontWeight: 600 }}>
        {(name[0] || '?').toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-500 text-[#f0f0f0]" style={{ fontWeight: 500 }}>{name}</span>
          <StatusBadge status={conv.status} />
          <span className="ml-auto text-xs text-[#444]">{timeAgo}</span>
        </div>
        <div className="text-xs text-[#555] truncate">
          {lastMsg ? (
            <span className={lastMsg.role === 'user' ? 'text-[#666]' : 'text-[#444]'}>
              {lastMsg.role !== 'user' && <span className="text-amber-600/70">Bot: </span>}
              {lastMsg.content.slice(0, 80)}
            </span>
          ) : (
            <span className="text-[#333]">Modo: {conv.mode}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function ConversationsPage() {
  const [tab, setTab] = useState('')
  const { data, isLoading } = useSWR<{ data: Conversation[] }>(
    `conversations-${tab}`,
    () => getConversations(tab || undefined),
    { refreshInterval: 20000 }
  )
  const convs = data?.data || []

  return (
    <PageShell>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-700 tracking-tight" style={{ fontWeight: 700 }}>Conversaciones</h1>
          <p className="text-sm text-[#555] mt-1">{convs.length} conversaciones</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#111] border border-[#1E1E1E] rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-150 ${
                tab === t.key
                  ? 'bg-amber-500/10 text-amber-400 font-500'
                  : 'text-[#555] hover:text-[#888]'
              }`}
              style={{ fontWeight: tab === t.key ? 500 : 400 }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
          {isLoading && (
            <div className="p-5 space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-32" />
                    <div className="skeleton h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && convs.length === 0 && (
            <div className="py-16 text-center text-[#444] text-sm">
              <div className="text-3xl mb-3">💬</div>
              No hay conversaciones en esta categoría
            </div>
          )}

          {!isLoading && convs.map(conv => <ConvRow key={conv.id} conv={conv} />)}
        </div>
      </div>
    </PageShell>
  )
}
