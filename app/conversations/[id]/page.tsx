'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { use, useState, useRef, useEffect } from 'react'
import PageShell from '@/components/PageShell'
import StatusBadge from '@/components/StatusBadge'
import { getConversation, takeoverConversation, releaseConversation, sendMessage, type Conversation, type Message } from '@/lib/api'
import { getToken } from '@/lib/auth'

function Bubble({ msg }: { msg: Message }) {
  const isUser  = msg.role === 'user'
  const isHuman = msg.role === 'human'
  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-[#1E1E1E] text-[#ccc] rounded-tl-sm'
          : isHuman
          ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100 rounded-tr-sm'
          : 'bg-[#1a1400] border border-[#2a2000] text-[#d4a]  rounded-tr-sm'
      }`}>
        {isHuman && (
          <div className="text-[10px] text-amber-500/70 mb-1 uppercase tracking-wider font-600" style={{ fontWeight: 600 }}>
            Erick (manual)
          </div>
        )}
        <span className="text-[#ccc]">{msg.content}</span>
      </div>
    </div>
  )
}

function ProfileChip({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="bg-[#161616] border border-[#242424] rounded-lg px-3 py-2">
      <div className="text-[9px] text-[#444] uppercase tracking-widest">{label}</div>
      <div className="text-xs text-[#aaa] mt-0.5 truncate">{value}</div>
    </div>
  )
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, mutate } = useSWR<{ data: Conversation }>(
    `conv-${id}`,
    () => getConversation(id),
    { refreshInterval: 7000 }
  )
  const conv          = data?.data
  const isTakeover    = conv?.status === 'takeover'
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [acting, setActing]   = useState(false)
  const [liveMessages, setLiveMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // SSE — real-time incoming messages
  useEffect(() => {
    const token = getToken()
    if (!token) return
    const base = process.env.NEXT_PUBLIC_API_URL || ''
    const es = new EventSource(`${base}/api/conversations/${id}/stream?token=${encodeURIComponent(token)}`)
    es.onmessage = (e) => {
      const newMsg: Message = JSON.parse(e.data)
      setLiveMessages(prev => [...prev, newMsg])
    }
    return () => es.close()
  }, [id])

  // Deduplicate: drop live messages that SWR already includes
  const dbIds = new Set((conv?.messages || []).map(m => m.id).filter(Boolean))
  const pendingLive = liveMessages.filter(m => !m.id || !dbIds.has(m.id))

  const messages: Message[] = [
    ...(conv?.history || []),
    ...(conv?.messages || []),
    ...pendingLive,
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleTakeover() {
    setActing(true)
    try { await takeoverConversation(id); mutate() } finally { setActing(false) }
  }

  async function handleRelease() {
    setActing(true)
    try { await releaseConversation(id); mutate() } finally { setActing(false) }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!msg.trim() || sending) return
    setSending(true)
    try { await sendMessage(id, msg.trim()); setMsg(''); mutate() } finally { setSending(false) }
  }

  return (
    <PageShell>
      <div className="animate-fade-in flex flex-col h-[calc(100vh-4rem)] max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <Link href="/conversations" className="text-[#555] hover:text-[#aaa] text-sm transition-colors">← Conversaciones</Link>
          <span className="text-[#333]">/</span>
          <span className="text-sm text-[#888] truncate">
            {conv?.contacts?.name || conv?.contacts?.external_id || '...'}
          </span>
          {conv && <div className="ml-auto"><StatusBadge status={conv.status} /></div>}
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[#444] text-sm">Cargando conversación...</div>
          </div>
        )}

        {conv && (
          <div className={`flex-1 flex flex-col overflow-hidden bg-[#111] border rounded-xl ${isTakeover ? 'border-amber-500/30 takeover-ring' : 'border-[#1E1E1E]'}`}>

            {/* Profile strip */}
            <div className="px-5 py-3 border-b border-[#1a1a1a] flex items-center gap-2 overflow-x-auto shrink-0">
              <ProfileChip label="Negocio"    value={conv.profile?.business} />
              <ProfileChip label="Necesita"   value={conv.profile?.need} />
              <ProfileChip label="Presupuesto" value={conv.profile?.budget ? `$${conv.profile.budget}` : null} />
              <ProfileChip label="Plazo"      value={conv.profile?.timeline} />
              <div className="ml-auto shrink-0 text-xs text-[#444]">Modo: {conv.mode}</div>
            </div>

            {/* Takeover banner */}
            {isTakeover && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center gap-3 shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-dot shrink-0" />
                <span className="text-sm text-amber-400 font-500" style={{ fontWeight: 500 }}>Modo Takeover — Escribes tú</span>
                <button
                  onClick={handleRelease}
                  disabled={acting}
                  className="ml-auto text-xs text-[#888] hover:text-[#ccc] border border-[#333] hover:border-[#555] px-3 py-1 rounded-lg transition-all"
                >
                  {acting ? '...' : 'Devolver al bot'}
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {messages.length === 0 && (
                <div className="text-center text-[#444] text-sm py-8">Sin mensajes aún</div>
              )}
              {messages.map((m, i) => <Bubble key={m.id || i} msg={m} />)}
              <div ref={bottomRef} />
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-[#1a1a1a] shrink-0">
              {!isTakeover ? (
                <button
                  onClick={handleTakeover}
                  disabled={acting || conv.status === 'done'}
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 font-500 py-2.5 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontWeight: 500 }}
                >
                  {acting ? 'Tomando control...' : conv.status === 'done' ? 'Conversación cerrada' : '⚡ Tomar control'}
                </button>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    placeholder="Escribe un mensaje como Erick..."
                    className="flex-1 bg-[#161616] border border-amber-500/20 focus:border-amber-500/40 rounded-lg px-4 py-2.5 text-sm text-[#f5f5f5] placeholder-[#444] focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!msg.trim() || sending}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-600 px-5 py-2.5 rounded-lg text-sm transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    {sending ? '...' : 'Enviar'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
