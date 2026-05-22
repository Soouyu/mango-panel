export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    active:   { label: 'Activa',    dot: 'bg-green-400',  bg: 'bg-green-400/10',  text: 'text-green-400' },
    takeover: { label: 'Takeover',  dot: 'bg-amber-400',  bg: 'bg-amber-400/10',  text: 'text-amber-400' },
    done:     { label: 'Completada',dot: 'bg-zinc-500',   bg: 'bg-zinc-500/10',   text: 'text-zinc-400' },
    closed:   { label: 'Cerrada',   dot: 'bg-zinc-600',   bg: 'bg-zinc-600/10',   text: 'text-zinc-500' },
  }
  const s = map[status] || map.closed
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-500 ${s.bg} ${s.text}`} style={{ fontWeight: 500 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'takeover' ? 'animate-pulse-dot' : ''}`} />
      {s.label}
    </span>
  )
}
