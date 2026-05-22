'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import PageShell from '@/components/PageShell'
import { getChannels, type Channel } from '@/lib/api'
import { getToken } from '@/lib/auth'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

const CHANNEL_META = {
  whatsapp:  { icon: '📱', label: 'WhatsApp',  color: '#25d366', bg: '#0a1a0f' },
  instagram: { icon: '📸', label: 'Instagram', color: '#e1306c', bg: '#1a0a0f' },
  facebook:  { icon: '🔵', label: 'Facebook',  color: '#1877f2', bg: '#0a0f1a' },
}

const BOT_META = {
  flow:  { label: 'Plan Flujo',  color: '#888',    badge: 'bg-[#1a1a1a] text-[#888]' },
  agent: { label: 'Plan Agente', color: '#FBBF24', badge: 'bg-amber-500/10 text-amber-400' },
  dual:  { label: 'Plan Dual',   color: '#a78bfa', badge: 'bg-violet-500/10 text-violet-400' },
}

// ── Connect Modal ─────────────────────────────────────────────────────────────

function ConnectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep]       = useState<'type' | 'form'>('type')
  const [type, setType]       = useState<'whatsapp' | 'instagram' | 'facebook'>('whatsapp')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    name:            '',
    identifier:      '',
    phone_number_id: '',
    access_token:    '',
    bot_type:        'dual',
    persona_name:    'Softy',
    business_name:   '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.identifier) return setError('Nombre e identificador son requeridos')
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${BASE}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ...form, type }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Error al crear canal')
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]">
          <h2 className="text-sm text-[#f5f5f5]" style={{ fontWeight: 600 }}>
            {step === 'type' ? 'Conectar canal' : `Configurar ${CHANNEL_META[type].label}`}
          </h2>
          <button onClick={onClose} className="text-[#555] hover:text-[#aaa] text-lg leading-none transition-colors">✕</button>
        </div>

        {/* Step 1 — elegir tipo */}
        {step === 'type' && (
          <div className="p-6 space-y-3">
            <p className="text-xs text-[#555] mb-4">¿Qué canal quieres conectar?</p>
            {(Object.entries(CHANNEL_META) as [keyof typeof CHANNEL_META, typeof CHANNEL_META[keyof typeof CHANNEL_META]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => { setType(key); setStep('form') }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#242424] hover:border-[#3a3a3a] hover:bg-white/3 transition-all text-left group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: meta.bg, border: `1px solid ${meta.color}33` }}
                >
                  {meta.icon}
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f5]" style={{ fontWeight: 500 }}>{meta.label}</p>
                  <p className="text-xs text-[#555] mt-0.5">
                    {key === 'whatsapp'  && 'Mensajes directos con la API oficial de Meta'}
                    {key === 'instagram' && 'Responde comentarios en tus publicaciones'}
                    {key === 'facebook'  && 'Responde comentarios en tu página de Facebook'}
                  </p>
                </div>
                <span className="ml-auto text-[#333] group-hover:text-[#888] transition-colors">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — formulario */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <button
              type="button"
              onClick={() => setStep('type')}
              className="text-xs text-[#555] hover:text-[#aaa] transition-colors mb-1"
            >
              ← Cambiar tipo
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="field-label">Nombre del canal</label>
                <input className="field-input" placeholder="Ej: WhatsApp Lambdacs" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>

              <div className="col-span-2">
                <label className="field-label">
                  {type === 'whatsapp' ? 'Número de teléfono' : 'Usuario o Page ID'}
                </label>
                <input className="field-input" placeholder={type === 'whatsapp' ? '+593999999999' : '@mi_negocio'} value={form.identifier} onChange={e => set('identifier', e.target.value)} required />
              </div>

              {type === 'whatsapp' && (
                <>
                  <div className="col-span-2">
                    <label className="field-label">Phone Number ID <span className="text-[#444]">(Meta)</span></label>
                    <input className="field-input font-mono text-xs" placeholder="123456789012345" value={form.phone_number_id} onChange={e => set('phone_number_id', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="field-label">Access Token <span className="text-[#444]">(Meta)</span></label>
                    <input className="field-input font-mono text-xs" type="password" placeholder="EAAxxxxxxx..." value={form.access_token} onChange={e => set('access_token', e.target.value)} />
                  </div>
                </>
              )}

              <div>
                <label className="field-label">Plan del bot</label>
                <select className="field-input" value={form.bot_type} onChange={e => set('bot_type', e.target.value)}>
                  <option value="flow">Plan Flujo (sin IA)</option>
                  <option value="agent">Plan Agente (1 IA)</option>
                  <option value="dual">Plan Dual (2 IAs)</option>
                </select>
              </div>

              <div>
                <label className="field-label">Nombre del bot</label>
                <input className="field-input" placeholder="Softy" value={form.persona_name} onChange={e => set('persona_name', e.target.value)} />
              </div>

              <div className="col-span-2">
                <label className="field-label">Nombre del negocio</label>
                <input className="field-input" placeholder="Ej: Lambdacs" value={form.business_name} onChange={e => set('business_name', e.target.value)} />
              </div>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-600 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black transition-all mt-2"
              style={{ fontWeight: 600 }}
            >
              {saving ? 'Conectando...' : `Conectar ${CHANNEL_META[type].label}`}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .field-label { display: block; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        .field-input { width: 100%; background: #161616; border: 1px solid #242424; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #f5f5f5; font-family: 'Sora', sans-serif; outline: none; transition: border-color 0.15s; }
        .field-input:focus { border-color: rgba(245,158,11,0.4); }
        select.field-input { cursor: pointer; }
      `}</style>
    </div>
  )
}

// ── Channel Card ──────────────────────────────────────────────────────────────

function ChannelCard({ ch }: { ch: Channel }) {
  const cm  = CHANNEL_META[ch.type]
  const bm  = BOT_META[(ch.bot_config?.bot_type ?? 'agent') as keyof typeof BOT_META]
  const isFlow = ch.bot_config?.bot_type === 'flow'

  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5 hover:border-[#2a2a2a] transition-all">
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: cm.bg, border: `1px solid ${cm.color}22` }}
        >
          {cm.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm text-[#f5f5f5]" style={{ fontWeight: 500 }}>{ch.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: cm.bg, color: cm.color }}>{cm.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${bm.badge}`}>{bm.label}</span>
          </div>
          <p className="text-xs text-[#555] truncate">{ch.identifier || ch.phone_number_id || '—'}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: ch.status === 'active' ? '#4ade80' : '#555' }} />
          <span className="text-[10px] text-[#555]">{ch.status === 'active' ? 'Activo' : 'Inactivo'}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-[#1a1a1a]">
        {isFlow && (
          <Link
            href={`/channels/${ch.id}/flow`}
            className="flex-1 text-center text-xs py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all"
            style={{ fontWeight: 500 }}
          >
            🔗 Constructor de flujo
          </Link>
        )}
        <Link
          href={`/channels/${ch.id}/config`}
          className="flex-1 text-center text-xs py-2 rounded-lg border border-[#242424] text-[#888] hover:border-[#3a3a3a] hover:text-[#ccc] transition-all"
        >
          Configurar bot
        </Link>
      </div>
    </div>
  )
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] border-dashed rounded-xl py-16 text-center">
      <div className="text-4xl mb-4">📡</div>
      <h3 className="text-sm text-[#888] mb-1" style={{ fontWeight: 500 }}>Sin canales conectados</h3>
      <p className="text-xs text-[#444] mb-6">Conecta WhatsApp, Instagram o Facebook para empezar</p>
      <button
        onClick={onConnect}
        className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm transition-all"
        style={{ fontWeight: 600 }}
      >
        + Conectar primer canal
      </button>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="skeleton w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-3 w-48" />
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-[#1a1a1a]">
        <div className="skeleton h-8 flex-1 rounded-lg" />
        <div className="skeleton h-8 flex-1 rounded-lg" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading, mutate } = useSWR<{ data: Channel[] }>('channels', () => getChannels(), {
    refreshInterval: 30000,
  })
  const channels = data?.data || []

  return (
    <PageShell>
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl tracking-tight" style={{ fontWeight: 700 }}>Canales</h1>
            <p className="text-sm text-[#555] mt-1">Gestiona tus integraciones de WhatsApp, Instagram y Facebook</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm transition-all"
            style={{ fontWeight: 600 }}
          >
            + Conectar canal
          </button>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          {Object.entries(BOT_META).map(([key, meta]) => (
            <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${meta.badge} border border-current/10`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isLoading
            ? Array(2).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : channels.length === 0
            ? <div className="col-span-2"><EmptyState onConnect={() => setShowModal(true)} /></div>
            : channels.map(ch => <ChannelCard key={ch.id} ch={ch} />)
          }
        </div>
      </div>

      {showModal && (
        <ConnectModal
          onClose={() => setShowModal(false)}
          onSuccess={() => mutate()}
        />
      )}
    </PageShell>
  )
}
