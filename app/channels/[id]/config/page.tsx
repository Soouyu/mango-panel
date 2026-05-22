'use client'
import { use, useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { useProtected } from '@/hooks/useProtected'
import { getChannel, saveBotConfig, type Channel, type BotConfig } from '@/lib/api'
import { getToken } from '@/lib/auth'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

const PLAN_INFO = {
  flow:  { label: 'Plan Flujo',  desc: 'Sin IA — menús y respuestas predefinidas', color: '#888888', tabs: ['general', 'flujo', 'horarios'] },
  agent: { label: 'Plan Agente', desc: 'Un motor de IA — lenguaje natural',         color: '#FBBF24', tabs: ['general', 'personalidad', 'respuestas', 'horarios'] },
  dual:  { label: 'Plan Dual',   desc: 'Dos motores de IA — máxima precisión',      color: '#a78bfa', tabs: ['general', 'personalidad', 'respuestas', 'horarios', 'avanzado'] },
}

const TAB_LABELS: Record<string, string> = {
  general:      'General',
  flujo:        'Flujo',
  personalidad: 'Personalidad',
  respuestas:   'Respuestas',
  horarios:     'Horarios',
  avanzado:     'Avanzado',
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#888] mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
      {hint && <p className="text-[10px] text-[#444] mb-2">{hint}</p>}
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input
      className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-amber-500/40 transition-colors"
      style={{ fontFamily: mono ? 'monospace' : undefined }}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 5 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-amber-500/40 transition-colors resize-none leading-relaxed"
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function TabGeneral({ cfg, setCfg, channel, onToggleStatus, toggling }: {
  cfg: Partial<BotConfig>
  setCfg: (c: Partial<BotConfig>) => void
  channel: Channel
  onToggleStatus: () => void
  toggling: boolean
}) {
  const isActive = channel.status === 'active'

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center justify-between p-4 bg-[#111] border border-[#1E1E1E] rounded-xl">
        <div>
          <p className="text-sm text-[#f5f5f5]" style={{ fontWeight: 500 }}>Estado del bot</p>
          <p className="text-xs text-[#555] mt-0.5">{isActive ? 'El bot está respondiendo mensajes' : 'El bot está pausado — no responde'}</p>
        </div>
        <button
          onClick={onToggleStatus}
          disabled={toggling}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
          style={{
            background: isActive ? '#1a0a0a' : '#0a1a0a',
            border: `1px solid ${isActive ? '#f8717133' : '#4ade8033'}`,
            color: isActive ? '#f87171' : '#4ade80',
            fontWeight: 500,
          }}
        >
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-[#555]'}`} />
          {toggling ? '...' : isActive ? 'Activo — pausar' : 'Pausado — activar'}
        </button>
      </div>

      {/* Plan */}
      <Field label="Plan del bot" hint="Cambiar el plan modifica cómo el bot procesa los mensajes">
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(PLAN_INFO) as [keyof typeof PLAN_INFO, typeof PLAN_INFO[keyof typeof PLAN_INFO]][]).map(([key, info]) => {
            const isSelected = cfg.bot_type === key
            return (
              <button
                key={key}
                onClick={() => setCfg({ ...cfg, bot_type: key })}
                className="p-3 rounded-xl text-left transition-all relative"
                style={{
                  background: isSelected ? `${info.color}1f` : '#111',
                  border: `2px solid ${isSelected ? info.color : '#1E1E1E'}`,
                  boxShadow: isSelected ? `0 0 0 1px ${info.color}33, 0 4px 18px ${info.color}1a` : 'none',
                }}
              >
                {isSelected && (
                  <span
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ background: info.color, boxShadow: `0 0 8px ${info.color}` }}
                  />
                )}
                <p className="text-xs mb-1" style={{ color: info.color, fontWeight: 600 }}>{info.label}</p>
                <p className="text-[10px] text-[#555] leading-relaxed">{info.desc}</p>
              </button>
            )
          })}
        </div>
      </Field>

      {/* Language */}
      <Field label="Idioma principal">
        <select
          className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-amber-500/40 transition-colors"
          value={cfg.language || 'es'}
          onChange={e => setCfg({ ...cfg, language: e.target.value })}
        >
          <option value="es">🇪🇨 Español</option>
          <option value="en">🇺🇸 English</option>
        </select>
      </Field>
    </div>
  )
}

function TabPersonalidad({ cfg, setCfg }: { cfg: Partial<BotConfig>; setCfg: (c: Partial<BotConfig>) => void }) {
  const services = (cfg.services || []) as { name: string; price: string; description: string }[]

  function addService() {
    setCfg({ ...cfg, services: [...services, { name: '', price: '', description: '' }] })
  }
  function updateService(i: number, field: string, value: string) {
    const updated = services.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    setCfg({ ...cfg, services: updated })
  }
  function removeService(i: number) {
    setCfg({ ...cfg, services: services.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre del asistente">
          <Input value={cfg.persona_name || ''} onChange={v => setCfg({ ...cfg, persona_name: v })} placeholder="Softy" />
        </Field>
        <Field label="Nombre del negocio">
          <Input value={cfg.business_name || ''} onChange={v => setCfg({ ...cfg, business_name: v })} placeholder="Mi Empresa" />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="text-xs text-[#888]" style={{ fontWeight: 500 }}>Servicios / Productos</label>
            <p className="text-[10px] text-[#444] mt-0.5">El bot usará esto para responder preguntas de precios</p>
          </div>
          <button onClick={addService} className="text-xs text-amber-500 hover:text-amber-400 transition-colors">+ Agregar</button>
        </div>

        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={i} className="p-4 bg-[#111] border border-[#1E1E1E] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#444] uppercase tracking-widest">Servicio {i + 1}</span>
                <button onClick={() => removeService(i)} className="text-[10px] text-[#444] hover:text-red-400 transition-colors">Eliminar</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input value={s.name} onChange={v => updateService(i, 'name', v)} placeholder="Ej: Plan Web Básico" />
                <Input value={s.price} onChange={v => updateService(i, 'price', v)} placeholder="Ej: $350" />
              </div>
              <Input value={s.description} onChange={v => updateService(i, 'description', v)} placeholder="Descripción breve del servicio..." />
            </div>
          ))}
          {services.length === 0 && (
            <div className="py-8 text-center border border-dashed border-[#1E1E1E] rounded-xl">
              <p className="text-xs text-[#444]">Sin servicios — agrega los que ofrece tu negocio</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabRespuestas({ cfg, setCfg }: { cfg: Partial<BotConfig>; setCfg: (c: Partial<BotConfig>) => void }) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className="space-y-6">
      <Field
        label="Mensaje de bienvenida"
        hint="Lo primero que el bot dice cuando alguien escribe por primera vez"
      >
        <Textarea
          value={(cfg as Record<string, string>).greeting_message || ''}
          onChange={v => setCfg({ ...cfg, greeting_message: v } as Partial<BotConfig>)}
          placeholder="¡Hola! 👋 Soy Softy, asistente de Mi Negocio. ¿En qué te puedo ayudar hoy?"
          rows={3}
        />
      </Field>

      <Field
        label="Mensaje fuera de horario"
        hint="Se envía cuando alguien escribe fuera del horario de atención"
      >
        <Textarea
          value={(cfg as Record<string, string>).ooh_message || ''}
          onChange={v => setCfg({ ...cfg, ooh_message: v } as Partial<BotConfig>)}
          placeholder="Estamos fuera de horario, pero déjanos tus datos y te contactamos pronto 👋"
          rows={3}
        />
      </Field>

      <Field
        label="Cómo presenta el bot al negocio"
        hint="Descripción del negocio que el bot usa al presentarse"
      >
        <Textarea
          value={(cfg as Record<string, string>).business_description || ''}
          onChange={v => setCfg({ ...cfg, business_description: v } as Partial<BotConfig>)}
          placeholder="Somos una agencia de desarrollo de software en Quito. Creamos páginas web, apps móviles y chatbots con IA..."
          rows={4}
        />
      </Field>

      <Field
        label="Tono del bot"
        hint="¿Cómo quieres que hable el asistente?"
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'profesional', label: '💼 Profesional', desc: 'Formal y concreto' },
            { value: 'amigable',    label: '😊 Amigable',    desc: 'Cálido y cercano' },
            { value: 'casual',      label: '🤙 Casual',      desc: 'Relajado y directo' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setCfg({ ...cfg, tone: opt.value } as Partial<BotConfig>)}
              className="p-3 rounded-xl border text-left transition-all"
              style={{
                background: (cfg as Record<string, string>).tone === opt.value ? '#1a1200' : '#111',
                border: `1px solid ${(cfg as Record<string, string>).tone === opt.value ? '#F59E0B55' : '#1E1E1E'}`,
              }}
            >
              <p className="text-xs text-[#f5f5f5] mb-0.5">{opt.label}</p>
              <p className="text-[10px] text-[#555]">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Field>

      {/* Raw prompt — solo para avanzados */}
      <div className="border-t border-[#1a1a1a] pt-5">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-2 text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          <span>{showRaw ? '▼' : '▶'}</span>
          {showRaw ? 'Ocultar prompt completo' : 'Ver / editar prompt completo (avanzado)'}
        </button>
        {showRaw && (
          <div className="mt-3">
            <Field label="System Prompt" hint="Edita directamente el prompt que recibe el modelo. Los cambios aquí sobreescriben los campos de arriba.">
              <Textarea
                value={cfg.system_prompt || ''}
                onChange={v => setCfg({ ...cfg, system_prompt: v })}
                placeholder="Eres un asistente de ventas..."
                rows={12}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}

function TabFlujo({ channelId, cfg }: { channelId: string; cfg: Partial<BotConfig> }) {
  const flow = cfg.flow_definition
  const nodeCount = flow?.nodes?.length || 0
  const edgeCount = flow?.edges?.length || 0
  const hasFlow = nodeCount > 1 // más que solo el nodo start

  return (
    <div className="space-y-6">
      <div className="p-5 bg-[#0d0d0d] border border-[#1E1E1E] rounded-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1a1200] border border-amber-500/20 flex items-center justify-center text-2xl shrink-0">
            🌳
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-[#f5f5f5] mb-1" style={{ fontWeight: 600 }}>Editor de flujo visual</h3>
            <p className="text-xs text-[#666] leading-relaxed">
              Plan Flujo no usa IA — sigue un árbol de mensajes y opciones que tú armas visualmente.
              Cada nodo es un paso de la conversación: mensajes, menús con opciones, acciones (capturar lead, finalizar, transferir a humano).
            </p>
          </div>
        </div>

        {hasFlow && (
          <div className="mt-5 pt-5 border-t border-[#1a1a1a] grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Nodos</p>
              <p className="text-lg text-[#f5f5f5]" style={{ fontWeight: 600 }}>{nodeCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Conexiones</p>
              <p className="text-lg text-[#f5f5f5]" style={{ fontWeight: 600 }}>{edgeCount}</p>
            </div>
          </div>
        )}

        {!hasFlow && (
          <div className="mt-5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400/80">
              ⚠️ Tu flujo aún está vacío. Sin nodos configurados, el bot solo responderá "Este canal no tiene flujo configurado".
            </p>
          </div>
        )}

        <Link
          href={`/channels/${channelId}/flow`}
          className="mt-5 flex items-center justify-center gap-2 w-full px-5 py-3 rounded-lg text-sm transition-all"
          style={{ background: '#F59E0B', color: '#000', fontWeight: 600 }}
        >
          {hasFlow ? 'Editar flujo →' : 'Crear flujo →'}
        </Link>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs text-[#555] uppercase tracking-widest">Cómo armar un flujo</h4>
        <div className="space-y-2 text-xs text-[#666] leading-relaxed">
          <p><span className="text-amber-500">1.</span> Arranca desde el nodo <strong className="text-[#888]">Inicio</strong> (verde, ya existe)</p>
          <p><span className="text-amber-500">2.</span> Agrega un <strong className="text-[#888]">Mensaje</strong> de bienvenida y conéctalo al Inicio</p>
          <p><span className="text-amber-500">3.</span> Agrega un <strong className="text-[#888]">Menú</strong> con opciones (ej: "1. Ver servicios", "2. Hablar con humano")</p>
          <p><span className="text-amber-500">4.</span> Cada opción del menú puede llevar a otro mensaje, menú o acción</p>
          <p><span className="text-amber-500">5.</span> Usa <strong className="text-[#888]">Acciones</strong> para capturar lead, finalizar o pasar a humano</p>
        </div>
      </div>
    </div>
  )
}

function TabHorarios({ cfg, setCfg }: { cfg: Partial<BotConfig>; setCfg: (c: Partial<BotConfig>) => void }) {
  const hours = (cfg.business_hours as { days: number[]; start: number; end: number }) || { days: [1,2,3,4,5], start: 9, end: 18 }

  function toggleDay(d: number) {
    const days = hours.days.includes(d) ? hours.days.filter(x => x !== d) : [...hours.days, d].sort()
    setCfg({ ...cfg, business_hours: { ...hours, days } })
  }

  return (
    <div className="space-y-6">
      <Field label="Días de atención" hint="El bot usará el mensaje de fuera de horario los días no seleccionados">
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((day, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className="w-12 h-12 rounded-xl text-xs transition-all"
              style={{
                background: hours.days.includes(i) ? '#1a1200' : '#161616',
                border: `1px solid ${hours.days.includes(i) ? '#F59E0B55' : '#242424'}`,
                color: hours.days.includes(i) ? '#FBBF24' : '#555',
                fontWeight: hours.days.includes(i) ? 600 : 400,
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Horario de atención">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] text-[#444] mb-1.5">Desde</p>
            <select
              className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-amber-500/40 transition-colors"
              value={hours.start}
              onChange={e => setCfg({ ...cfg, business_hours: { ...hours, start: parseInt(e.target.value) } })}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <span className="text-[#444] mt-5">→</span>
          <div className="flex-1">
            <p className="text-[10px] text-[#444] mb-1.5">Hasta</p>
            <select
              className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-amber-500/40 transition-colors"
              value={hours.end}
              onChange={e => setCfg({ ...cfg, business_hours: { ...hours, end: parseInt(e.target.value) } })}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>
      </Field>

      <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
        <p className="text-xs text-[#555]">
          Horario activo: <span className="text-[#888]">
            {hours.days.map(d => DAYS[d]).join(', ')} · {String(hours.start).padStart(2,'0')}:00 – {String(hours.end).padStart(2,'0')}:00
          </span>
        </p>
      </div>
    </div>
  )
}

const MODES_INFO = [
  { key: 'GREETING',  label: 'Bienvenida',      icon: '👋', color: '#4ade80', desc: 'Primer mensaje — el usuario acaba de escribir por primera vez' },
  { key: 'EXPLORING', label: 'Exploración',      icon: '🔍', color: '#60a5fa', desc: 'El usuario pregunta sobre servicios sin mostrar interés claro aún' },
  { key: 'CAPTURING', label: 'Captura de lead',  icon: '🎯', color: '#FBBF24', desc: 'El usuario mostró interés — el bot recoge nombre, negocio, necesidad, plazo y presupuesto' },
  { key: 'DONE',      label: 'Completado',       icon: '✅', color: '#a78bfa', desc: 'Lead guardado — el bot confirma y no vuelve a pedir datos' },
  { key: 'SUPPORT',   label: 'Soporte',          icon: '🔧', color: '#fb923c', desc: 'El usuario es cliente existente o reporta un problema técnico' },
  { key: 'SLEEPING',  label: 'Fuera de horario', icon: '🌙', color: '#94a3b8', desc: 'Mensaje recibido fuera del horario de atención configurado' },
]

function ModeCard({
  mode, value, onChange,
}: {
  mode: typeof MODES_INFO[0]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const hasCustom = value.trim().length > 0

  return (
    <div
      className="border rounded-xl overflow-hidden transition-all"
      style={{ borderColor: open ? mode.color + '33' : '#1E1E1E', background: open ? '#0d0d0d' : '#111' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-base">{mode.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#f5f5f5]" style={{ fontWeight: 600 }}>{mode.label}</span>
            {hasCustom && (
              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide" style={{ background: mode.color + '22', color: mode.color, fontWeight: 700 }}>
                personalizado
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#444] mt-0.5">{mode.desc}</p>
        </div>
        <span className="text-[#333] text-xs">{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <Textarea
            value={value}
            onChange={onChange}
            placeholder={`Instrucciones para el modo ${mode.label}. Si está vacío se usa el comportamiento por defecto del motor.`}
            rows={6}
          />
          {hasCustom && (
            <button
              onClick={() => onChange('')}
              className="mt-2 text-[10px] text-[#444] hover:text-red-400 transition-colors"
            >
              Restaurar por defecto
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TabAvanzado({ cfg, setCfg }: { cfg: Partial<BotConfig>; setCfg: (c: Partial<BotConfig>) => void }) {
  function updateModeInstruction(key: string, value: string) {
    const current = (cfg.mode_instructions || {}) as Record<string, string>
    setCfg({ ...cfg, mode_instructions: { ...current, [key]: value } })
  }

  return (
    <div className="space-y-8">
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <p className="text-xs text-amber-400/80">⚠️ Configuración avanzada — solo para el Plan Dual. Cambios aquí afectan directamente el comportamiento del motor de IA.</p>
      </div>

      {/* Contadores */}
      <div className="space-y-4">
        <h3 className="text-xs text-[#555] uppercase tracking-widest">Límites de captura</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Máximo intercambios en captura" hint="Respuestas del bot antes de cerrar y guardar el lead">
            <input
              type="number" min={3} max={20}
              className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-amber-500/40 transition-colors"
              value={(cfg as Record<string, unknown>).max_capturing_exchanges as number || 8}
              onChange={e => setCfg({ ...cfg, max_capturing_exchanges: parseInt(e.target.value) } as Partial<BotConfig>)}
            />
          </Field>
          <Field label="Límite absoluto" hint="El bot cierra sí o sí al llegar aquí">
            <input
              type="number" min={5} max={30}
              className="w-full bg-[#161616] border border-[#242424] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-amber-500/40 transition-colors"
              value={(cfg as Record<string, unknown>).hard_cap_exchanges as number || 14}
              onChange={e => setCfg({ ...cfg, hard_cap_exchanges: parseInt(e.target.value) } as Partial<BotConfig>)}
            />
          </Field>
        </div>
      </div>

      {/* Instrucciones por modo */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs text-[#555] uppercase tracking-widest">Instrucciones por modo (GPT)</h3>
          <p className="text-[10px] text-[#333] mt-1">Personaliza cómo responde GPT en cada etapa. Si está vacío usa el comportamiento por defecto.</p>
        </div>
        <div className="space-y-2">
          {MODES_INFO.map(mode => (
            <ModeCard
              key={mode.key}
              mode={mode}
              value={((cfg.mode_instructions || {}) as Record<string, string>)[mode.key] || ''}
              onChange={v => updateModeInstruction(mode.key, v)}
            />
          ))}
        </div>
      </div>

      {/* Prompts completos */}
      <div className="space-y-4">
        <h3 className="text-xs text-[#555] uppercase tracking-widest">Prompts completos</h3>

        <Field label="Prompt de análisis (DeepSeek)" hint="El primer motor — analiza la intención y clasifica el modo de la conversación">
          <Textarea
            value={(cfg as Record<string, string>).analyze_prompt || ''}
            onChange={v => setCfg({ ...cfg, analyze_prompt: v } as Partial<BotConfig>)}
            placeholder="Prompt del analizador DeepSeek (JSON-only analyzer)..."
            rows={8}
          />
        </Field>

        <Field label="Prompt de respuesta (GPT)" hint="El segundo motor — genera la respuesta. Las instrucciones por modo de arriba se agregan automáticamente.">
          <Textarea
            value={cfg.system_prompt || ''}
            onChange={v => setCfg({ ...cfg, system_prompt: v })}
            placeholder="Prompt del generador GPT (personalidad, negocio, servicios, reglas)..."
            rows={8}
          />
        </Field>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  useProtected()

  const { data, mutate } = useSWR<{ data: Channel }>(`channel-${id}`, () => getChannel(id))
  const channel = data?.data

  const [tab, setTab]       = useState('general')
  const [cfg, setCfg]       = useState<Partial<BotConfig>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (channel?.bot_config) {
      setCfg(channel.bot_config)
    }
  }, [channel])

  const botType   = (cfg.bot_type || 'dual') as keyof typeof PLAN_INFO
  const planInfo  = PLAN_INFO[botType] || PLAN_INFO.dual
  const visibleTabs = planInfo.tabs

  if (tab && !visibleTabs.includes(tab)) setTab('general')

  async function handleSave() {
    setSaving(true)
    try {
      await saveBotConfig(id, cfg)
      setSaved(true)
      mutate()
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus() {
    if (!channel) return
    setToggling(true)
    try {
      const newStatus = channel.status === 'active' ? 'inactive' : 'active'
      await fetch(`${BASE}/api/channels/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      })
      mutate()
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-8 h-14 border-b border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-xs">
            <Link href="/channels" className="text-[#555] hover:text-[#888] transition-colors">Canales</Link>
            <span className="text-[#333]">/</span>
            <span className="text-[#888]">{channel?.name || '...'}</span>
            <span className="text-[#333]">/</span>
            <span className="text-[#555]">Configurar bot</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
            style={{
              background: saved ? '#166534' : '#F59E0B',
              color: saved ? '#4ade80' : '#000',
              fontWeight: 600,
            }}
          >
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-8">

            {/* Channel info */}
            {channel && (
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#0a1a0f] border border-green-400/20 flex items-center justify-center text-lg">📱</div>
                <div>
                  <h1 className="text-lg text-[#f5f5f5]" style={{ fontWeight: 700 }}>{channel.name}</h1>
                  <p className="text-xs text-[#555]">{channel.identifier}</p>
                </div>
                <div className="ml-auto px-3 py-1 rounded-full text-xs" style={{ background: `${planInfo.color}11`, color: planInfo.color, fontWeight: 600 }}>
                  {planInfo.label}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-[#111] border border-[#1E1E1E] rounded-xl p-1">
              {visibleTabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: tab === t ? '#1a1a1a' : 'transparent',
                    color: tab === t ? '#f5f5f5' : '#555',
                    fontWeight: tab === t ? 600 : 400,
                    border: tab === t ? '1px solid #2a2a2a' : '1px solid transparent',
                  }}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'general'      && channel && <TabGeneral      cfg={cfg} setCfg={setCfg} channel={channel} onToggleStatus={toggleStatus} toggling={toggling} />}
            {tab === 'flujo'        && <TabFlujo        channelId={id} cfg={cfg} />}
            {tab === 'personalidad' && <TabPersonalidad cfg={cfg} setCfg={setCfg} />}
            {tab === 'respuestas'   && <TabRespuestas   cfg={cfg} setCfg={setCfg} />}
            {tab === 'horarios'     && <TabHorarios     cfg={cfg} setCfg={setCfg} />}
            {tab === 'avanzado'     && <TabAvanzado     cfg={cfg} setCfg={setCfg} />}
          </div>
        </div>
      </div>
    </div>
  )
}
