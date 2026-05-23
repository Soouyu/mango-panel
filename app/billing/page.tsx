'use client'
import { useState } from 'react'
import useSWR from 'swr'
import Sidebar from '@/components/Sidebar'
import { useProtected } from '@/hooks/useProtected'
import {
  getCreditsBalance,
  getCreditsStats,
  rechargeCredits,
  getCreditsHistory,
  type CreditsBalance,
  type CreditsStats,
  type CreditPurchase,
  type UsageLog,
} from '@/lib/api'

const PLAN_COLORS: Record<string, string> = {
  flow: '#888888',
  agent: '#FBBF24',
  dual: '#a78bfa',
}

const PLAN_LABELS: Record<string, string> = {
  flow: 'Flujo',
  agent: 'Agente',
  dual: 'Dual',
}

function fmtUsd(v: number) {
  return `$${(v || 0).toFixed(2)}`
}

function fmtCredits(v: number) {
  return Math.floor(v || 0).toLocaleString()
}

function fmtDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Components ────────────────────────────────────────────────────────────────

function BalanceCard({ balance }: { balance: CreditsBalance }) {
  const creditsInUsd  = balance.credits_balance / balance.credits_per_usd
  const consumedInUsd = balance.total_consumed   / balance.credits_per_usd
  const isLow = creditsInUsd < 5

  return (
    <div className="p-6 rounded-2xl border" style={{
      background: isLow ? 'linear-gradient(135deg, #1a0a0a, #0d0d0d)' : 'linear-gradient(135deg, #1a1200, #0d0d0d)',
      borderColor: isLow ? '#f8717155' : '#F59E0B33',
    }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-[#888] uppercase tracking-widest mb-1">Saldo actual</p>
          <p className="text-4xl font-bold text-[#f5f5f5]" style={{ fontWeight: 700 }}>
            {fmtCredits(balance.credits_balance)} <span className="text-base text-[#666] font-normal">créditos</span>
          </p>
          <p className="text-sm text-[#888] mt-1">≈ {fmtUsd(creditsInUsd)} USD</p>
        </div>
        {isLow && (
          <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wide" style={{ background: '#f8717122', color: '#f87171', fontWeight: 600 }}>
            Saldo bajo
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a1a1a]">
        <div>
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-0.5">Total recargado</p>
          <p className="text-sm text-[#ccc]">{fmtUsd(balance.total_purchased)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-0.5">Total consumido</p>
          <p className="text-sm text-[#ccc]">{fmtUsd(consumedInUsd)}</p>
        </div>
      </div>
    </div>
  )
}

function MonthStats({ stats }: { stats: CreditsStats }) {
  const { this_month } = stats
  return (
    <div className="p-6 rounded-2xl border border-[#1E1E1E] bg-[#0d0d0d]">
      <p className="text-xs text-[#888] uppercase tracking-widest mb-4">Este mes</p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-2xl text-[#f5f5f5]" style={{ fontWeight: 700 }}>{this_month.messages}</p>
          <p className="text-[10px] text-[#555] mt-0.5">Mensajes</p>
        </div>
        <div>
          <p className="text-2xl text-[#f5f5f5]" style={{ fontWeight: 700 }}>{fmtCredits(this_month.credits)}</p>
          <p className="text-[10px] text-[#555] mt-0.5">Créditos usados</p>
        </div>
        <div>
          <p className="text-2xl text-[#f5f5f5]" style={{ fontWeight: 700 }}>{fmtUsd(this_month.credits / 100)}</p>
          <p className="text-[10px] text-[#555] mt-0.5">Costo</p>
        </div>
      </div>
      {Object.keys(this_month.by_plan || {}).length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex gap-2 flex-wrap">
          {Object.entries(this_month.by_plan).map(([plan, count]) => (
            <span key={plan} className="px-2.5 py-1 rounded-md text-[10px]" style={{
              background: `${PLAN_COLORS[plan] || '#888'}22`,
              color: PLAN_COLORS[plan] || '#888',
              fontWeight: 600,
            }}>
              {PLAN_LABELS[plan] || plan}: {count} msgs
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function RechargePanel({ packs, onRecharge }: {
  packs: CreditsBalance['packs']
  onRecharge: (amount: number, ref?: string, notes?: string) => Promise<void>
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [ref, setRef] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleRecharge() {
    const amount = selected ?? parseFloat(customAmount)
    if (!amount || amount <= 0) return
    setLoading(true)
    try {
      await onRecharge(amount, ref || undefined, notes || undefined)
      setSuccess(true)
      setSelected(null)
      setCustomAmount('')
      setRef('')
      setNotes('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error'
      alert('Error al recargar: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 rounded-2xl border border-[#1E1E1E] bg-[#0d0d0d]">
      <h3 className="text-sm text-[#f5f5f5] mb-1" style={{ fontWeight: 600 }}>Recargar créditos</h3>
      <p className="text-xs text-[#555] mb-5">Elige un paquete o ingresa monto personalizado (USD)</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {packs.map(pack => {
          const isSelected = selected === pack.amount
          return (
            <button
              key={pack.amount}
              onClick={() => { setSelected(pack.amount); setCustomAmount('') }}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: isSelected ? '#1a1200' : '#111',
                border: `2px solid ${isSelected ? '#F59E0B' : '#1E1E1E'}`,
              }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-lg text-[#f5f5f5]" style={{ fontWeight: 700 }}>${pack.amount}</span>
                <span className="text-[10px] text-[#888] uppercase tracking-wide">{pack.label}</span>
              </div>
              <p className="text-xs text-[#888]">{pack.credits.toLocaleString()} créditos</p>
              {pack.bonus > 0 && (
                <p className="text-[10px] text-green-400 mt-0.5" style={{ fontWeight: 600 }}>+ {pack.bonus} bonus</p>
              )}
            </button>
          )
        })}
      </div>

      <div className="mb-4">
        <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1.5">O monto custom</label>
        <input
          type="number" min={1} step={1}
          className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-amber-500/40"
          placeholder="$15"
          value={customAmount}
          onChange={e => { setCustomAmount(e.target.value); setSelected(null) }}
        />
      </div>

      <details className="mb-4">
        <summary className="text-[10px] text-[#555] cursor-pointer hover:text-[#888]">Datos opcionales (referencia de pago, notas)</summary>
        <div className="mt-3 space-y-2">
          <input
            className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2 text-xs text-[#f5f5f5] focus:outline-none focus:border-amber-500/40"
            placeholder="Referencia (ej: transfer ID, num cuenta)"
            value={ref}
            onChange={e => setRef(e.target.value)}
          />
          <input
            className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2 text-xs text-[#f5f5f5] focus:outline-none focus:border-amber-500/40"
            placeholder="Notas (ej: pago Lambdacs Mayo)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </details>

      <button
        onClick={handleRecharge}
        disabled={loading || (!selected && !customAmount)}
        className="w-full px-5 py-3 rounded-lg text-sm transition-all disabled:opacity-40"
        style={{
          background: success ? '#166534' : '#F59E0B',
          color: success ? '#4ade80' : '#000',
          fontWeight: 600,
        }}
      >
        {loading ? 'Procesando...' : success ? '✓ Créditos agregados' : 'Recargar (manual)'}
      </button>

      <p className="text-[10px] text-[#444] mt-3 text-center">
        Por ahora la recarga es manual. Próximamente integración con PayPhone.
      </p>
    </div>
  )
}

function HistoryTab({ orgRefresh }: { orgRefresh: number }) {
  const [type, setType] = useState<'usage' | 'purchases'>('purchases')
  const { data, isLoading } = useSWR(
    [`credits-history-${type}`, orgRefresh],
    () => getCreditsHistory(type, 30),
  )
  const rows = data?.data || []

  return (
    <div className="p-6 rounded-2xl border border-[#1E1E1E] bg-[#0d0d0d]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-[#f5f5f5]" style={{ fontWeight: 600 }}>Historial</h3>
        <div className="flex gap-1 bg-[#111] border border-[#1E1E1E] rounded-lg p-1">
          {(['purchases', 'usage'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="px-3 py-1 rounded-md text-[10px] uppercase tracking-wide transition-all"
              style={{
                background: type === t ? '#1a1a1a' : 'transparent',
                color: type === t ? '#f5f5f5' : '#555',
                fontWeight: type === t ? 600 : 400,
              }}
            >
              {t === 'purchases' ? 'Recargas' : 'Consumo'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-xs text-[#444]">Cargando...</p>}
      {!isLoading && rows.length === 0 && (
        <p className="text-xs text-[#444] py-8 text-center">Sin movimientos aún</p>
      )}

      <div className="space-y-2">
        {type === 'purchases' && (rows as CreditPurchase[]).map(r => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#1a1a1a]">
            <div>
              <p className="text-xs text-[#ccc]" style={{ fontWeight: 500 }}>+{fmtCredits(r.credits_added)} créditos</p>
              <p className="text-[10px] text-[#555] mt-0.5">{r.payment_method} · {fmtDate(r.created_at)}{r.notes ? ' · ' + r.notes : ''}</p>
            </div>
            <span className="text-sm text-green-400" style={{ fontWeight: 600 }}>+{fmtUsd(r.amount)}</span>
          </div>
        ))}
        {type === 'usage' && (rows as UsageLog[]).map(r => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#1a1a1a]">
            <div>
              <p className="text-xs text-[#ccc]" style={{ fontWeight: 500 }}>
                {r.plan_type ? PLAN_LABELS[r.plan_type] : '—'} · {fmtDate(r.created_at)}
              </p>
              <p className="text-[10px] text-[#555] mt-0.5">≈ ${(r.cost_estimate_usd || 0).toFixed(4)} costo real</p>
            </div>
            <span className="text-sm text-[#f87171]" style={{ fontWeight: 600 }}>-{r.credits_charged}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  useProtected()
  const [refresh, setRefresh] = useState(0)

  const { data: balData, mutate: mutateBal } = useSWR(['credits-balance', refresh], () => getCreditsBalance())
  const { data: statsData, mutate: mutateStats } = useSWR(['credits-stats', refresh], () => getCreditsStats())

  const balance = balData?.data
  const stats   = statsData?.data

  async function handleRecharge(amount: number, ref?: string, notes?: string) {
    await rechargeCredits(amount, 'manual', ref, notes)
    mutateBal()
    mutateStats()
    setRefresh(r => r + 1)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-56 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <h1 className="text-2xl text-[#f5f5f5] mb-1" style={{ fontWeight: 700 }}>Facturación</h1>
          <p className="text-sm text-[#666] mb-8">Gestiona créditos y monitorea el consumo del bot</p>

          {balance && stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BalanceCard balance={balance} />
              <MonthStats stats={stats} />
              <RechargePanel packs={balance.packs} onRecharge={handleRecharge} />
              <HistoryTab orgRefresh={refresh} />
            </div>
          ) : (
            <p className="text-sm text-[#555]">Cargando...</p>
          )}
        </div>
      </div>
    </div>
  )
}
