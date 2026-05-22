'use client'
import '@xyflow/react/dist/style.css'
import { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Panel,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from '@xyflow/react'
import { saveFlowDefinition } from '@/lib/api'

// ── Constants for MenuNode handle positioning ─────────────────────────────────

const MH = 33   // menu header height (py-2 + text-xs + border)
const MM = 32   // menu message row height (py-2 + text-xs, when present)
const MP = 8    // options section padding-top
const MO = 28   // each option row height (h-7)

// ── Types ─────────────────────────────────────────────────────────────────────

export type BotNodeType = 'start' | 'message' | 'menu' | 'action'

type ND = { [key: string]: unknown }

export interface StartData   extends ND { type: 'start' }
export interface MessageData extends ND { type: 'message'; label: string; message: string }
export interface MenuOption              { id: string; label: string }
export interface MenuData    extends ND { type: 'menu'; label: string; message: string; options: MenuOption[] }
export interface ActionData  extends ND { type: 'action'; label: string; action: 'takeover' | 'end' | 'capture_lead' }

export type FlowNodeData = StartData | MessageData | MenuData | ActionData

// ── Handle style ──────────────────────────────────────────────────────────────

const HS = {
  width: 10,
  height: 10,
  background: '#F59E0B',
  border: '2px solid #0f0f0f',
  borderRadius: '50%',
}

// ── Custom Nodes ──────────────────────────────────────────────────────────────

function nodeBorder(selected?: boolean) {
  return selected
    ? 'border-amber-500'
    : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
}
function nodeGlow(selected?: boolean) {
  return selected ? '0 0 0 1px #F59E0B55, 0 0 20px #F59E0B11' : 'none'
}

function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-xl border overflow-hidden transition-all ${nodeBorder(selected)}`}
      style={{ background: '#0a0a0a', boxShadow: nodeGlow(selected) }}
    >
      <div className="px-3 py-2 flex items-center gap-2 border-b border-[#1a1a1a]">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-600 text-green-400 uppercase tracking-widest">Inicio</span>
      </div>
      <div className="px-3 py-3">
        <p className="text-xs text-[#555]">Punto de entrada del flujo</p>
      </div>
      <Handle type="source" position={Position.Bottom} style={HS} />
    </div>
  )
}

function MessageNode({ data, selected }: NodeProps) {
  const d = data as MessageData
  return (
    <div
      className={`min-w-[220px] max-w-[280px] rounded-xl border overflow-hidden transition-all ${nodeBorder(selected)}`}
      style={{ background: '#0a0a0a', boxShadow: nodeGlow(selected) }}
    >
      <Handle type="target" position={Position.Top} style={HS} />
      <div className="px-3 py-2 flex items-center gap-2 border-b border-[#1a1a1a]">
        <span className="text-[11px]">💬</span>
        <span className="text-[10px] font-600 text-[#888] uppercase tracking-widest">Mensaje</span>
        {d.label && <span className="ml-auto text-[10px] text-[#3a3a3a] truncate max-w-[90px]">{d.label}</span>}
      </div>
      <div className="px-3 py-3 min-h-[48px]">
        {d.message
          ? <p className="text-xs text-[#bbb] leading-relaxed line-clamp-3">{d.message}</p>
          : <p className="text-xs text-[#3a3a3a] italic">Sin mensaje...</p>
        }
      </div>
      <Handle type="source" position={Position.Bottom} style={HS} />
    </div>
  )
}

function MenuNode({ data, selected }: NodeProps) {
  const d = data as MenuData
  const hasMsg = !!d.message

  return (
    <div className="relative min-w-[240px]">
      {/* Target handle (entrada) */}
      <Handle type="target" position={Position.Top} style={HS} />

      {/* Caja con overflow-hidden para clipping visual */}
      <div
        className={`rounded-xl border overflow-hidden transition-all ${nodeBorder(selected)}`}
        style={{ background: '#0a0a0a', boxShadow: nodeGlow(selected) }}
      >
        {/* Header — MH px */}
        <div className="px-3 py-2 flex items-center gap-2 border-b border-[#1a1a1a]">
          <span className="text-[11px]">📋</span>
          <span className="text-[10px] font-600 text-blue-400 uppercase tracking-widest">Menú</span>
          {d.label && <span className="ml-auto text-[10px] text-[#3a3a3a] truncate max-w-[90px]">{d.label}</span>}
        </div>

        {/* Message — MM px */}
        {hasMsg && (
          <div className="px-3 py-2 border-b border-[#141414]">
            <p className="text-xs text-[#666] truncate">{d.message}</p>
          </div>
        )}

        {/* Options */}
        <div style={{ paddingTop: MP, paddingBottom: 8 }}>
          {d.options.length === 0 && (
            <div style={{ height: MO }} className="px-3 flex items-center">
              <p className="text-[10px] text-[#3a3a3a] italic">Sin opciones — selecciona para editar</p>
            </div>
          )}
          {d.options.map((opt, i) => (
            <div
              key={opt.id}
              style={{ height: MO }}
              className="px-3 flex items-center gap-2"
            >
              <span className="text-[10px] text-amber-500 w-4 shrink-0" style={{ fontWeight: 700 }}>{i + 1}.</span>
              <span className="text-xs text-[#ccc] truncate flex-1 pr-4">{opt.label || `Opción ${i + 1}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Source handles — FUERA del overflow-hidden para que no se corten */}
      {d.options.map((opt, i) => (
        <Handle
          key={`h-${opt.id}`}
          type="source"
          position={Position.Right}
          id={opt.id}
          style={{
            ...HS,
            position: 'absolute',
            top: MH + (hasMsg ? MM : 0) + MP + i * MO + MO / 2 - HS.height / 2,
            right: -HS.width / 2,
            transform: 'none',
          }}
        />
      ))}
    </div>
  )
}

function ActionNode({ data, selected }: NodeProps) {
  const d = data as ActionData
  const META: Record<string, { label: string; color: string; icon: string; bg: string }> = {
    takeover:     { label: 'Tomar control',  color: '#FBBF24', icon: '⚡', bg: '#1a1200' },
    end:          { label: 'Finalizar',       color: '#f87171', icon: '⬛', bg: '#1a0a0a' },
    capture_lead: { label: 'Capturar lead',   color: '#4ade80', icon: '✅', bg: '#0a1a0a' },
  }
  const meta = META[d.action] || META.end
  return (
    <div
      className={`min-w-[180px] rounded-xl border overflow-hidden transition-all ${nodeBorder(selected)}`}
      style={{ background: '#0a0a0a', boxShadow: nodeGlow(selected) }}
    >
      <Handle type="target" position={Position.Top} style={HS} />
      <div className="px-3 py-2 flex items-center gap-2 border-b border-[#1a1a1a]">
        <span className="text-[11px]">{meta.icon}</span>
        <span className="text-[10px] font-600 uppercase tracking-widest" style={{ color: meta.color }}>Acción</span>
      </div>
      <div className="px-3 py-3" style={{ background: meta.bg }}>
        <p className="text-xs font-600" style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</p>
        {d.label && <p className="text-[10px] text-[#555] mt-0.5">{d.label}</p>}
      </div>
    </div>
  )
}

const nodeTypes = { start: StartNode, message: MessageNode, menu: MenuNode, action: ActionNode }

// ── Node Editor Panel ─────────────────────────────────────────────────────────

function NodePanel({
  node,
  onUpdate,
  onDelete,
}: {
  node: Node | null
  onUpdate: (id: string, data: Partial<FlowNodeData>) => void
  onDelete: (id: string) => void
}) {
  const d = node?.data as FlowNodeData | undefined

  return (
    <aside className="w-72 bg-[#0f0f0f] border-l border-[#1a1a1a] flex flex-col overflow-y-auto shrink-0">
      <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <span className="text-sm text-[#f5f5f5]" style={{ fontWeight: 600 }}>
          {node ? 'Editar nodo' : 'Nodos'}
        </span>
        {node && d?.type !== 'start' && (
          <button
            onClick={() => onDelete(node.id)}
            className="text-[10px] text-[#555] hover:text-red-400 transition-colors uppercase tracking-widest"
          >
            Eliminar
          </button>
        )}
      </div>

      {!node && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-5">
          <div className="text-center space-y-1">
            <p className="text-xs text-[#444]">Selecciona un nodo</p>
            <p className="text-[10px] text-[#333]">para editar su contenido</p>
          </div>
          <div className="w-full border-t border-[#1a1a1a] pt-4 space-y-1">
            <p className="text-[10px] text-[#444] uppercase tracking-widest mb-3">Atajos</p>
            {[
              { icon: '💬', name: 'Mensaje', desc: 'Envía texto al usuario' },
              { icon: '📋', name: 'Menú', desc: 'Muestra opciones numeradas' },
              { icon: '⚡', name: 'Acción', desc: 'Takeover, fin, captura lead' },
            ].map(item => (
              <div key={item.name} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[#111] border border-[#1a1a1a]">
                <span className="text-sm mt-px">{item.icon}</span>
                <div>
                  <p className="text-xs text-[#ccc]" style={{ fontWeight: 500 }}>{item.name}</p>
                  <p className="text-[10px] text-[#555] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {node && d && (
        <div className="p-5 space-y-5">

          {d.type === 'start' && (
            <div className="p-3 rounded-lg bg-green-400/5 border border-green-400/10">
              <p className="text-xs text-[#555] leading-relaxed">
                El nodo de inicio es el punto de entrada del flujo. No se puede eliminar ni mover lógicamente del inicio de la cadena.
              </p>
            </div>
          )}

          {(d.type === 'message' || d.type === 'menu') && (
            <Field label="Nombre del nodo">
              <input
                className="input-flow"
                value={(d as MessageData | MenuData).label}
                onChange={e => onUpdate(node.id, { label: e.target.value })}
                placeholder="Ej: Menú principal"
              />
            </Field>
          )}

          {(d.type === 'message' || d.type === 'menu') && (
            <Field label="Mensaje que enviará el bot">
              <textarea
                className="input-flow resize-none"
                rows={4}
                value={(d as MessageData | MenuData).message}
                onChange={e => onUpdate(node.id, { message: e.target.value })}
                placeholder="Escribe el mensaje que el bot enviará al usuario..."
              />
            </Field>
          )}

          {d.type === 'menu' && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[10px] text-[#555] uppercase tracking-widest">Opciones del menú</label>
                <button
                  onClick={() => {
                    const menu = d as MenuData
                    onUpdate(node.id, {
                      options: [...menu.options, { id: crypto.randomUUID(), label: '' }],
                    })
                  }}
                  className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors"
                >
                  + Agregar
                </button>
              </div>
              <div className="space-y-2">
                {(d as MenuData).options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-[#555] w-4 shrink-0 text-center">{i + 1}</span>
                    <input
                      className="input-flow flex-1 text-xs"
                      value={opt.label}
                      onChange={e => {
                        const menu = d as MenuData
                        onUpdate(node.id, {
                          options: menu.options.map(o => o.id === opt.id ? { ...o, label: e.target.value } : o),
                        })
                      }}
                      placeholder={`Opción ${i + 1}`}
                    />
                    <button
                      onClick={() => {
                        const menu = d as MenuData
                        onUpdate(node.id, { options: menu.options.filter(o => o.id !== opt.id) })
                      }}
                      className="text-[#444] hover:text-red-400 text-xs transition-colors w-4 shrink-0 text-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {(d as MenuData).options.length === 0 && (
                  <p className="text-[10px] text-[#3a3a3a] italic px-1">Agrega al menos una opción para conectar nodos</p>
                )}
              </div>
            </div>
          )}

          {d.type === 'action' && (
            <>
              <Field label="Nombre del nodo">
                <input
                  className="input-flow"
                  value={(d as ActionData).label}
                  onChange={e => onUpdate(node.id, { label: e.target.value })}
                  placeholder="Ej: Contactar agente"
                />
              </Field>
              <Field label="Acción a ejecutar">
                <select
                  className="input-flow"
                  value={(d as ActionData).action}
                  onChange={e => onUpdate(node.id, { action: e.target.value as ActionData['action'] })}
                >
                  <option value="takeover">⚡ Tomar control — agente humano</option>
                  <option value="end">⬛ Finalizar conversación</option>
                  <option value="capture_lead">✅ Capturar lead y notificar</option>
                </select>
              </Field>
            </>
          )}
        </div>
      )}
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INIT_NODES: Node[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 320, y: 80 },
    data: { type: 'start' } as StartData,
    deletable: false,
  },
]

const INIT_EDGES: Edge[] = []

const EDGE_DEFAULTS = {
  style: { stroke: '#2a2a2a', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#2a2a2a', width: 16, height: 16 },
}

// ── FlowBuilder ───────────────────────────────────────────────────────────────

export default function FlowBuilder({
  channelId,
  channelName = 'Canal',
  initialNodes = INIT_NODES,
  initialEdges = INIT_EDGES,
}: {
  channelId: string
  channelName?: string
  initialNodes?: Node[]
  initialEdges?: Edge[]
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selected, setSelected]         = useState<Node | null>(null)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)

  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges(eds =>
        addEdge({
          ...conn,
          style: { stroke: '#F59E0B', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B', width: 14, height: 14 },
          animated: false,
        }, eds)
      ),
    [setEdges]
  )

  const onNodeClick = useCallback((_: unknown, node: Node) => setSelected(node), [])
  const onPaneClick = useCallback(() => setSelected(null), [])

  function updateNodeData(id: string, patch: Partial<FlowNodeData>) {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
    setSelected(prev => prev?.id === id ? { ...prev, data: { ...prev.data, ...patch } } : prev)
  }

  function deleteNode(id: string) {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    setSelected(null)
  }

  function addNode(type: 'message' | 'menu' | 'action') {
    const id  = crypto.randomUUID()
    const pos = { x: 180 + Math.random() * 220, y: 260 + Math.random() * 120 }
    const dataMap: Record<string, FlowNodeData> = {
      message: { type: 'message', label: 'Mensaje', message: '' },
      menu:    { type: 'menu',    label: 'Menú',    message: '', options: [] },
      action:  { type: 'action',  label: 'Acción',  action: 'end' },
    }
    setNodes(nds => [...nds, { id, type, position: pos, data: dataMap[type] as FlowNodeData }])
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveFlowDefinition(channelId, {
        nodes: nodes.map(n => ({ id: n.id, type: n.type!, position: n.position, data: n.data as Record<string, unknown> })),
        edges: edges.map(e => ({ id: e.id!, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('Error al guardar — revisa la conexión con el servidor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative">
        <style>{`
          .input-flow {
            width: 100%;
            background: #161616;
            border: 1px solid #242424;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            color: #f5f5f5;
            font-family: 'Sora', sans-serif;
            outline: none;
            transition: border-color 0.15s;
          }
          .input-flow:focus { border-color: rgba(245,158,11,0.4); }
          .react-flow__controls { background: #111 !important; border: 1px solid #1E1E1E !important; border-radius: 10px !important; overflow: hidden; }
          .react-flow__controls-button { background: #111 !important; border-bottom-color: #1a1a1a !important; color: #888 !important; }
          .react-flow__controls-button:hover { background: #1a1a1a !important; color: #f5f5f5 !important; }
          .react-flow__minimap { background: #111 !important; border: 1px solid #1E1E1E !important; border-radius: 10px !important; overflow: hidden; }
          .react-flow__edge-path { stroke-width: 1.5; }
          .react-flow__handle { cursor: crosshair; }
        `}</style>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={EDGE_DEFAULTS}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#080808' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            color="#1a1a1a"
            gap={24}
            size={1.5}
          />
          <Controls />
          <MiniMap
            nodeColor="#1a1a1a"
            maskColor="rgba(8,8,8,0.75)"
          />

          {/* Top bar */}
          <Panel position="top-left">
            <div className="flex items-center gap-1.5 bg-[#111] border border-[#1E1E1E] rounded-xl px-4 py-2.5 shadow-lg">
              <span className="text-[10px] text-[#555] uppercase tracking-widest mr-1.5">{channelName}</span>
              <div className="h-3.5 w-px bg-[#222]" />
              {([
                { t: 'message' as const, icon: '💬', label: 'Mensaje' },
                { t: 'menu'    as const, icon: '📋', label: 'Menú' },
                { t: 'action'  as const, icon: '⚡', label: 'Acción' },
              ] as const).map(({ t, icon, label }) => (
                <button
                  key={t}
                  onClick={() => addNode(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#777] hover:text-[#f5f5f5] hover:bg-white/5 border border-transparent hover:border-[#242424] transition-all"
                >
                  <span>{icon}</span>
                  <span>+ {label}</span>
                </button>
              ))}
              <div className="h-3.5 w-px bg-[#222] mx-1" />
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-600 transition-all disabled:opacity-50"
                style={{
                  fontWeight: 600,
                  background: saved ? '#166534' : '#F59E0B',
                  color: saved ? '#4ade80' : '#000',
                }}
              >
                {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar flujo'}
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right panel */}
      <NodePanel node={selected} onUpdate={updateNodeData} onDelete={deleteNode} />
    </div>
  )
}
