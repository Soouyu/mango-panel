'use client'
import useSWR from 'swr'
import PageShell from '@/components/PageShell'
import { getStats, type DashboardStats } from '@/lib/api'

function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`bg-[#111] border rounded-xl p-6 transition-all duration-200 hover:border-[#2a2a2a] ${accent ? 'border-amber-500/20 amber-glow' : 'border-[#1E1E1E]'}`}>
      <div className="text-xs text-[#555] uppercase tracking-widest mb-3">{label}</div>
      <div className={`text-4xl font-800 tracking-tight mb-1 ${accent ? 'text-amber-400' : 'text-[#f5f5f5]'}`} style={{ fontWeight: 800 }}>
        {value}
      </div>
      {sub && <div className="text-sm text-[#555]">{sub}</div>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-6">
      <div className="skeleton h-3 w-24 mb-3" />
      <div className="skeleton h-10 w-16 mb-1" />
      <div className="skeleton h-3 w-32" />
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useSWR<{ data: DashboardStats }>('stats', getStats, { refreshInterval: 30000 })
  const s = data?.data

  const conversionRate = s
    ? s.leads.total > 0
      ? Math.round((s.leads.fullProfile / s.leads.total) * 100)
      : 0
    : null

  return (
    <PageShell>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-700 tracking-tight" style={{ fontWeight: 700 }}>Dashboard</h1>
          <p className="text-sm text-[#555] mt-1">Vista general de tu operación</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Leads este mes"      value={s?.leads.thisMonth ?? 0}       sub={`${s?.leads.total ?? 0} totales`} accent />
              <StatCard label="Perfil completo"     value={s?.leads.fullProfile ?? 0}      sub="5 de 5 campos" />
              <StatCard label="Conversaciones"      value={s?.conversations.total ?? 0}    sub={`${s?.conversations.active ?? 0} activas ahora`} />
              <StatCard label="Tasa de conversión"  value={`${conversionRate ?? 0}%`}      sub="leads con perfil completo" />
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Activas"   value={s?.conversations.active   ?? 0} sub="bot respondiendo" />
              <StatCard label="Takeover"  value={s?.conversations.takeover ?? 0} sub="control manual" />
              <StatCard label="Contactos" value={s?.contacts.total         ?? 0} sub={`${s?.contacts.thisMonth ?? 0} este mes`} />
            </>
          )}
        </div>

        {/* Status bar */}
        {s && (
          <div className="mt-6 bg-[#111] border border-[#1E1E1E] rounded-xl p-5 flex items-center gap-6 animate-slide-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
              <span className="text-sm text-[#888]">Bot activo</span>
            </div>
            <div className="h-4 w-px bg-[#222]" />
            <div className="text-sm text-[#555]">
              <span className="text-amber-400 font-600" style={{ fontWeight: 600 }}>{s.conversations.done}</span> conversaciones cerradas
            </div>
            <div className="h-4 w-px bg-[#222]" />
            <div className="text-sm text-[#555]">
              <span className="text-[#f5f5f5] font-600" style={{ fontWeight: 600 }}>{s.contacts.thisMonth}</span> contactos nuevos este mes
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
