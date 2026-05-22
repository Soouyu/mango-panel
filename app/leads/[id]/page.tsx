'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { use } from 'react'
import PageShell from '@/components/PageShell'
import { getLead, type Lead, type Message } from '@/lib/api'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-[#161616] border border-[#242424] rounded-lg px-4 py-3">
      <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm text-[#ddd]">{value || <span className="text-[#444]">—</span>}</div>
    </div>
  )
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const isHuman = msg.role === 'human'
  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-2`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-[#1E1E1E] text-[#ddd] rounded-tl-sm'
          : isHuman
          ? 'bg-amber-500/20 border border-amber-500/30 text-amber-200 rounded-tr-sm'
          : 'bg-[#1a1400] border border-amber-900/30 text-amber-100 rounded-tr-sm'
      }`}>
        {isHuman && <div className="text-[10px] text-amber-500/70 mb-1 uppercase tracking-wider">Erick</div>}
        {msg.content}
      </div>
    </div>
  )
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useSWR<{ data: Lead }>(`lead-${id}`, () => getLead(id))
  const lead = data?.data
  const history: Message[] = lead?.conversations?.history || []

  return (
    <PageShell>
      <div className="animate-fade-in max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/leads" className="text-[#555] hover:text-[#aaa] text-sm transition-colors">← Leads</Link>
          <span className="text-[#333]">/</span>
          <span className="text-sm text-[#888]">{lead?.name || 'Lead'}</span>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <div className="skeleton h-8 w-48" />
            <div className="grid grid-cols-2 gap-3">
              {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-16" />)}
            </div>
          </div>
        )}

        {lead && (
          <>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-lg font-700 text-amber-400" style={{ fontWeight: 700 }}>
                {lead.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="text-xl font-700 tracking-tight" style={{ fontWeight: 700 }}>{lead.name || '—'}</h1>
                <div className="text-sm text-[#555] mt-0.5">
                  +{lead.contacts?.external_id} · {new Date(lead.captured_at).toLocaleDateString('es-EC', { dateStyle: 'long' })}
                </div>
              </div>
              {lead.all_fields_filled && (
                <span className="ml-auto text-xs bg-green-400/10 text-green-400 px-3 py-1 rounded-full border border-green-400/20">
                  Perfil completo ✓
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Field label="Negocio"     value={lead.business} />
              <Field label="Necesita"    value={lead.need} />
              <Field label="Plazo"       value={lead.timeline} />
              <Field label="Presupuesto" value={lead.budget ? `$${lead.budget}` : null} />
              <Field label="Idioma"      value={lead.language === 'es' ? 'Español' : 'English'} />
              <Field label="Campos"      value={`${lead.fields_count} / 5`} />
            </div>

            {history.length > 0 && (
              <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1a1a1a]">
                  <span className="text-xs text-[#444] uppercase tracking-widest">Conversación</span>
                </div>
                <div className="p-5 max-h-96 overflow-y-auto">
                  {history.map((msg, i) => <Bubble key={i} msg={msg} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
