'use client'
import useSWR from 'swr'
import Link from 'next/link'
import PageShell from '@/components/PageShell'
import { getLeads, type Lead } from '@/lib/api'

function chip(label: string | null | undefined, color = '#333', text = '#aaa') {
  if (!label) return null
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-xs" style={{ background: color, color: text }}>
      {label}
    </span>
  )
}

function LeadRow({ lead }: { lead: Lead }) {
  const phone = lead.contacts?.external_id || '—'
  const name  = lead.name || lead.contacts?.name || '—'
  const date  = new Date(lead.captured_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })

  return (
    <Link href={`/leads/${lead.id}`} className="flex items-start gap-4 px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-xs font-600 text-amber-400 shrink-0 mt-0.5" style={{ fontWeight: 600 }}>
        {(name !== '—' ? name[0] : phone[3] || '?').toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-500 text-[#f0f0f0]" style={{ fontWeight: 500 }}>{name}</span>
          <span className="text-xs text-[#444]">+{phone}</span>
          {lead.all_fields_filled && (
            <span className="ml-auto text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">5/5</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chip(lead.need,     '#1a1a1a', '#888')}
          {chip(lead.business, '#1a1a1a', '#888')}
          {chip(lead.budget ? `$${lead.budget}` : null, '#1c1500', '#d97706')}
          {chip(lead.timeline, '#0f1a1a', '#4ade80')}
        </div>
      </div>

      <div className="text-xs text-[#444] shrink-0 mt-0.5">{date}</div>
    </Link>
  )
}

export default function LeadsPage() {
  const { data, isLoading } = useSWR<{ data: Lead[] }>('leads', () => getLeads(), { refreshInterval: 30000 })
  const leads = data?.data || []

  return (
    <PageShell>
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-700 tracking-tight" style={{ fontWeight: 700 }}>Leads</h1>
            <p className="text-sm text-[#555] mt-1">{leads.length} leads capturados</p>
          </div>
        </div>

        <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3 border-b border-[#1a1a1a] flex items-center gap-4">
            <span className="text-xs text-[#444] uppercase tracking-widest">Contacto</span>
            <span className="ml-auto text-xs text-[#444] uppercase tracking-widest">Fecha</span>
          </div>

          {isLoading && (
            <div className="p-5 space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-40" />
                    <div className="skeleton h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && leads.length === 0 && (
            <div className="py-16 text-center text-[#444] text-sm">
              <div className="text-3xl mb-3">🥭</div>
              Aún no hay leads capturados
            </div>
          )}

          {!isLoading && leads.map(lead => <LeadRow key={lead.id} lead={lead} />)}
        </div>
      </div>
    </PageShell>
  )
}
