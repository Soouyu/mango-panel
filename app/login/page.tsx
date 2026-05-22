'use client'
import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api'
import { saveAuth, isAuthenticated } from '@/lib/auth'

const SCENE_MS = 13000

const CHANNELS = [
  { key: 'wa',  label: 'WhatsApp', color: '#25D366' },
  { key: 'ig',  label: 'Instagram', color: '#E1306C' },
  { key: 'fb',  label: 'Facebook',  color: '#1877F2' },
  { key: 'web', label: 'Web Chat',  color: '#F59E0B' },
]

const WORDS = ['Tus', 'agentes', 'de', 'IA', 'controlados', 'desde', 'cualquier', 'parte']

const KEYFRAMES = `
@keyframes sceneIn   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
@keyframes msgIn     { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:none} }
@keyframes badgeIn   { from{opacity:0;transform:scale(.86)}       to{opacity:1;transform:scale(1)} }
@keyframes typingOut { to{opacity:0;transform:scale(.8)} }
@keyframes dotBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes wordIn    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
@keyframes tabPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
@keyframes scanDown  { 0%{top:-2px;opacity:0} 5%{opacity:1} 88%{opacity:.95} 100%{top:100%;opacity:0} }
@keyframes hlAmber   { from{border-color:transparent;background:#151515;color:#bbb} to{border-color:#F59E0B66;background:#F59E0B14;color:#fde68a;box-shadow:0 0 12px #F59E0B20} }
@keyframes hlBlue    { from{border-color:transparent;background:#222428;color:#bbb} to{border-color:#1877F266;background:#1877F214;color:#88aaff;box-shadow:0 0 12px #1877F220} }
@keyframes fadeUp    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
`

// ── primitives ────────────────────────────────────────────────────────────────

function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ animation: 'sceneIn 0.45s ease-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: '#0d1117', borderRadius: 22, overflow: 'hidden',
        border: '1px solid #ffffff18', width: '100%', height: '100%',
        boxShadow: '0 32px 80px #000e, 0 0 0 1px #ffffff06',
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  )
}

function Msg({ delay, dir, bg, color, border, radius, children }: {
  delay: number; dir: 'left' | 'right'; bg: string; color: string;
  border?: string; radius: string; children: ReactNode
}) {
  return (
    <div style={{ animation: `msgIn 0.3s ease-out ${delay}s both`, display: 'flex', justifyContent: dir === 'left' ? 'flex-start' : 'flex-end', marginBottom: 9 }}>
      <div style={{ background: bg, color, fontSize: 13, padding: '9px 13px', borderRadius: radius, maxWidth: '80%', lineHeight: 1.5, border: border ? `1px solid ${border}` : undefined }}>
        {children}
      </div>
    </div>
  )
}

function Typing({ delay, hideAt, color, bg, border }: { delay: number; hideAt: number; color: string; bg: string; border: string }) {
  return (
    <div style={{ animation: `msgIn 0.2s ease-out ${delay}s both, typingOut 0.25s ease-in ${hideAt}s forwards`, display: 'flex', justifyContent: 'flex-end', marginBottom: 9 }}>
      <div style={{ background: bg, border: `1px solid ${border}`, padding: '10px 14px', borderRadius: '10px 10px 2px 10px', display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'block', animation: `dotBounce 0.8s ease-in-out ${delay + i * 0.15}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

function Badge({ delay, color, bg, border, children }: { delay: number; color: string; bg: string; border: string; children: ReactNode }) {
  return (
    <div style={{ animation: `badgeIn 0.4s ease-out ${delay}s both`, display: 'flex', justifyContent: 'center', marginTop: 8 }}>
      <div style={{ background: bg, border: `1px solid ${border}`, color, fontSize: 12, fontWeight: 600, padding: '6px 18px', borderRadius: 20, letterSpacing: '0.05em' }}>
        {children}
      </div>
    </div>
  )
}

// ── Icon SVGs ─────────────────────────────────────────────────────────────────

const HeartIcon = ({ size = 20, color = '#888' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
const CommentIcon = ({ size = 20, color = '#888' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const PaperPlane = ({ size = 20, color = '#888' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill={color} stroke="none" />
  </svg>
)
const BookmarkIcon = ({ size = 20, color = '#888' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const ThumbIcon = ({ size = 16, color = '#b0b3b8' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zm-7 11H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2v11z" />
  </svg>
)

// ── WhatsApp ──────────────────────────────────────────────────────────────────

function SceneWA() {
  return (
    <PhoneShell>
      <div style={{ background: '#25D366', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>WhatsApp</div>
          <div style={{ color: '#ffffffaa', fontSize: 11 }}>en línea</div>
        </div>
      </div>
      <div style={{ padding: '16px 14px', flex: 1, overflow: 'hidden' }}>
        <Msg delay={0.5} dir="left" bg="#1e2a1e" color="#d4f5d4" radius="10px 10px 10px 2px">
          Hola, quiero una página para mi restaurante
        </Msg>
        <Typing delay={1.4} hideAt={2.4} color="#25D366" bg="#182418" border="#25D36630" />
        <Msg delay={2.6} dir="right" bg="#1a2a1a" color="#d4f5d4" border="#25D36630" radius="10px 10px 2px 10px">
          ¡Hola! Soy Softy 👋 Cuéntame más sobre tu restaurante, ¿qué tipo de cocina?
        </Msg>
        <Msg delay={3.8} dir="left" bg="#1e2a1e" color="#d4f5d4" radius="10px 10px 10px 2px">
          Italiana, queremos más reservas online
        </Msg>
        <Badge delay={5.0} color="#25D366" bg="#25D36618" border="#25D36650">Lead capturado ✓</Badge>
      </div>
    </PhoneShell>
  )
}

// ── Instagram ─────────────────────────────────────────────────────────────────

const IG_COMMENTS = [
  { user: 'carlos.mk',   text: '¿Cuánto cuesta una web?' },
  { user: 'sofia_biz',   text: 'Me interesa para mi tienda 👀' },
  { user: 'andres_dev',  text: '¿Tienen portafolio?' },
]

function SceneIG() {
  return (
    <PhoneShell>
      {/* Account header */}
      <div style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', padding: 2, background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#E1306C' }}>L</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f5f5' }}>lambdacs.dev</div>
          <div style={{ fontSize: 10, color: '#555' }}>Patrocinado</div>
        </div>
        <div style={{ color: '#555', fontSize: 18, lineHeight: 1 }}>···</div>
      </div>

      {/* Post image */}
      <div style={{ height: 140, flexShrink: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#1a0830 0%,#3d0a5f 45%,#8b1a4a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: '#E1306C15', top: -50, right: -50 }} />
        <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: '#F7773715', bottom: -30, left: -10 }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Automatiza tu</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B', lineHeight: 1.2, letterSpacing: '-0.02em' }}>atención al cliente</div>
          <div style={{ fontSize: 10, color: '#ffffff44', marginTop: 8 }}>🚀 lambdacs.dev</div>
        </div>
      </div>

      {/* Action bar — Instagram exact icon paths */}
      <div style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 16, background: '#0d0d0d', flexShrink: 0 }}>
        {/* Heart */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z" fill="#e4e6eb"/>
        </svg>
        {/* Comment bubble */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="#e4e6eb" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
        {/* Paper plane / Send */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M22 2 11 13" stroke="#e4e6eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2 15 22 11 13 2 9l20-7Z" stroke="#e4e6eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{ flex: 1 }} />
        <BookmarkIcon size={22} color="#e4e6eb" />
      </div>

      {/* Likes + caption */}
      <div style={{ padding: '0 14px 6px', background: '#0d0d0d', flexShrink: 0, animation: 'fadeUp 0.3s ease-out 0.3s both' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f5f5', marginBottom: 2 }}>2,847 Me gusta</div>
        <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700, color: '#f5f5f5' }}>lambdacs.dev </span>
          Diseñamos páginas web que convierten visitas en clientes ✨
        </div>
        <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>Ver los 24 comentarios</div>
      </div>

      {/* Comments + scan — flex: 1 fills remaining space */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', padding: '6px 14px 10px', borderTop: '1px solid #161616', background: '#0d0d0d' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg,transparent,#F59E0Bcc,transparent)',
          animation: 'scanDown 1.6s ease-in-out 1.8s both',
          pointerEvents: 'none', zIndex: 3,
          boxShadow: '0 0 10px #F59E0B99',
        }} />

        {IG_COMMENTS.map((c, i) => (
          <div key={i} style={{ animation: `msgIn 0.28s ease-out ${0.7 + i * 0.4}s both`, display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${i * 80 + 200},38%,22%)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#aaa' }}>
              {c.user[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <div style={{ fontSize: 12, color: '#ccc', padding: '5px 10px', borderRadius: 8, background: '#131313', border: '1px solid transparent', animation: i === 0 ? 'hlAmber 0.5s ease-out 3.0s forwards' : undefined, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: '#777', marginRight: 5, fontSize: 11 }}>{c.user}</span>{c.text}
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25, flexShrink: 0 }}>
                <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z" fill="#888"/>
              </svg>
            </div>
          </div>
        ))}

        {/* Bot DM reply */}
        <div style={{ animation: 'badgeIn 0.4s ease-out 4.0s both', background: 'linear-gradient(135deg,#833AB418,#F7773718)', border: '1px solid #E1306C35', borderRadius: 10, padding: '7px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#833AB4,#FD1D1D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <path d="M22 2 11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M22 2 15 22 11 13 2 9l20-7Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 10, color: '#E1306C', fontWeight: 700, letterSpacing: '0.04em' }}>Softy · DM automático</span>
          </div>
          <div style={{ fontSize: 12, color: '#ddd', lineHeight: 1.4 }}>¡Hola! Vi tu comentario 👀 Te mando info por DM ahora mismo 🚀</div>
        </div>
      </div>
    </PhoneShell>
  )
}

// ── Facebook ──────────────────────────────────────────────────────────────────

const FB_COMMENTS = [
  { user: 'Pedro Ramos',   text: '¿Cuánto cobran por una web?' },
  { user: 'Laura V.',      text: 'Me interesa para mi negocio' },
  { user: 'Diego Morales', text: '¿Tienen WhatsApp?' },
]

function SceneFB() {
  return (
    <PhoneShell>
      {/* Post header */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 10, background: '#1c1e21', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>L</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e6eb' }}>Lambdacs</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#b0b3b8' }}>3 h</span>
            <span style={{ fontSize: 11, color: '#b0b3b8' }}>·</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#b0b3b8"><circle cx="12" cy="12" r="10" fill="none" stroke="#b0b3b8" strokeWidth="1.5"/><path d="M12 2a10 10 0 0 1 0 20M2 12h20M12 2c-2.5 3-4 6.5-4 10s1.5 7 4 10M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10" stroke="#b0b3b8" strokeWidth="1.5" fill="none"/></svg>
          </div>
        </div>
        <div style={{ color: '#555', fontSize: 20 }}>···</div>
      </div>

      {/* Post text */}
      <div style={{ padding: '0 14px 8px', fontSize: 13, color: '#e4e6eb', lineHeight: 1.5, background: '#1c1e21', flexShrink: 0, animation: 'fadeUp 0.3s ease-out 0.2s both' }}>
        ¿Tu negocio necesita más clientes? 🎯 Automatiza tu atención con agentes de IA 24/7
      </div>

      {/* Post image */}
      <div style={{ height: 110, flexShrink: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#0a1a3e,#0e2875,#1877F235)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: '#1877F215', top: -40, right: -40 }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Agentes de IA</div>
          <div style={{ fontSize: 12, color: '#4da3ff', marginTop: 3 }}>para tu negocio · lambdacs.dev</div>
        </div>
      </div>

      {/* Reactions count */}
      <div style={{ padding: '6px 14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d2f33', background: '#1c1e21', flexShrink: 0, animation: 'fadeUp 0.3s ease-out 0.3s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, color: '#b0b3b8' }}>
          <span>👍</span><span>❤️</span><span>😮</span><span style={{ marginLeft: 3 }}>1,247</span>
        </div>
        <div style={{ fontSize: 11, color: '#666' }}>48 comentarios</div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2d2f33', background: '#1c1e21', flexShrink: 0 }}>
        {[
          { label: 'Me gusta', icon: <ThumbIcon size={16} color="#b0b3b8" /> },
          { label: 'Comentar',  icon: <CommentIcon size={16} color="#b0b3b8" /> },
          { label: 'Compartir', icon: <PaperPlane size={14} color="#b0b3b8" /> },
        ].map(btn => (
          <div key={btn.label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', fontSize: 12, color: '#b0b3b8' }}>
            {btn.icon} {btn.label}
          </div>
        ))}
      </div>

      {/* Comments + scan — flex: 1 */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', padding: '8px 14px 10px', background: '#1c1e21' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg,transparent,#1877F2cc,transparent)',
          animation: 'scanDown 1.6s ease-in-out 1.8s both',
          pointerEvents: 'none', zIndex: 3,
          boxShadow: '0 0 10px #1877F299',
        }} />

        {FB_COMMENTS.map((c, i) => (
          <div key={i} style={{ animation: `msgIn 0.28s ease-out ${0.6 + i * 0.4}s both`, display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${i * 60 + 210},40%,22%)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#aaa' }}>
              {c.user[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, background: '#2d2f33', border: '1px solid transparent', color: '#e4e6eb', animation: i === 0 ? 'hlBlue 0.5s ease-out 3.0s forwards' : undefined, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, color: '#888', display: 'block', fontSize: 11 }}>{c.user}</span>
                {c.text}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 2, paddingLeft: 4, fontSize: 10, color: '#555' }}>
                <span>Me gusta</span><span>Responder</span>
              </div>
            </div>
          </div>
        ))}

        {/* Bot reply */}
        <div style={{ animation: 'badgeIn 0.4s ease-out 3.9s both', background: '#1877F210', border: '1px solid #1877F235', borderRadius: 10, padding: '7px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CommentIcon size={8} color="white" />
            </div>
            <span style={{ fontSize: 10, color: '#1877F2', fontWeight: 700, letterSpacing: '0.04em' }}>Softy · Respuesta automática</span>
          </div>
          <div style={{ fontSize: 12, color: '#e4e6eb', lineHeight: 1.4 }}>¡Hola Pedro! Te contactamos por Messenger con todos los detalles 📩</div>
        </div>
      </div>
    </PhoneShell>
  )
}

// ── Web Chat ──────────────────────────────────────────────────────────────────

function SceneWeb() {
  return (
    <PhoneShell>
      <div style={{ background: '#F59E0B', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#00000018', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>💬</div>
        <div>
          <div style={{ color: '#000', fontSize: 14, fontWeight: 700 }}>Web Chat</div>
          <div style={{ color: '#00000066', fontSize: 11 }}>lambdacs.dev · en línea</div>
        </div>
      </div>
      <div style={{ padding: '16px 14px', flex: 1, overflow: 'hidden' }}>
        <Msg delay={0.4} dir="right" bg="#1a1200" color="#fde68a" border="#F59E0B22" radius="10px 10px 2px 10px">
          ¡Hola! 👋 Soy Softy. ¿En qué puedo ayudarte hoy?
        </Msg>
        <Msg delay={1.3} dir="left" bg="#1e1e1e" color="#ddd" radius="10px 10px 10px 2px">
          Necesito una app móvil para mi negocio
        </Msg>
        <Typing delay={2.1} hideAt={3.1} color="#F59E0B" bg="#1a1200" border="#F59E0B28" />
        <Msg delay={3.3} dir="right" bg="#1a1200" color="#fde68a" border="#F59E0B22" radius="10px 10px 2px 10px">
          ¡Genial! ¿Qué tipo de negocio tienes y qué necesitarías en la app?
        </Msg>
        <Msg delay={4.6} dir="left" bg="#1e1e1e" color="#ddd" radius="10px 10px 10px 2px">
          Es una tienda de ropa, quiero pedidos en línea
        </Msg>
        <Badge delay={5.8} color="#F59E0B" bg="#F59E0B18" border="#F59E0B50">Lead calificado ✓</Badge>
      </div>
    </PhoneShell>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [scene, setScene] = useState(0)
  const [tick, setTick]   = useState(0)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard')
  }, [router])

  useEffect(() => {
    const id = setInterval(() => {
      setScene(s => (s + 1) % 4)
      setTick(t => t + 1)
    }, SCENE_MS)
    return () => clearInterval(id)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await login(email, password)
      saveAuth(res.token, res.user)
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  function switchScene(i: number) {
    setScene(i)
    setTick(t => t + 1)
  }

  const activeColor = CHANNELS[scene].color

  const sceneEl = [
    <SceneWA  key={`wa-${tick}`}  />,
    <SceneIG  key={`ig-${tick}`}  />,
    <SceneFB  key={`fb-${tick}`}  />,
    <SceneWeb key={`web-${tick}`} />,
  ][scene]

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ display: 'flex', height: '100vh', background: '#080808', fontFamily: 'Sora, sans-serif', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div style={{
          width: '60%', background: '#0b0b0b',
          borderRight: '1px solid #1a1a1a',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '28px 60px', overflow: 'hidden', position: 'relative',
          height: '100vh',
        }}>
          {/* ambient glow */}
          <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: activeColor + '07', filter: 'blur(110px)', transition: 'background 1.2s ease', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 280, height: 280, borderRadius: '50%', background: activeColor + '05', filter: 'blur(80px)', transition: 'background 1.2s ease', pointerEvents: 'none' }} />

          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative', zIndex: 1, maxWidth: 520, flexShrink: 0 }}>
            <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.25, color: '#f0f0f0', marginBottom: 10, letterSpacing: '-0.02em' }}>
              {WORDS.map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: 9, animation: `wordIn 0.45s ease-out ${i * 0.07}s both`, color: i === 3 ? activeColor : undefined, transition: 'color 0.6s ease' }}>
                  {w}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Omnichannel · Automatizado · Escalable
            </div>
          </div>

          {/* Scene — fixed height, never expands */}
          <div style={{
            width: '100%', maxWidth: 480, position: 'relative', zIndex: 1,
            height: 'clamp(340px, calc(100vh - 270px), 460px)',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {sceneEl}
          </div>

          {/* Channel tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, position: 'relative', zIndex: 1, flexShrink: 0 }}>
            {CHANNELS.map((ch, i) => {
              const active = i === scene
              return (
                <button key={ch.key} onClick={() => switchScene(i)} style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 12,
                  fontWeight: active ? 700 : 400,
                  border: `1px solid ${active ? ch.color + '60' : '#252525'}`,
                  background: active ? ch.color + '18' : 'transparent',
                  color: active ? ch.color : '#444',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.25s ease',
                  animation: active ? 'tabPulse 2.2s ease-in-out infinite' : undefined,
                }}>
                  {ch.label}
                </button>
              )
            })}
          </div>

          <div style={{ position: 'absolute', bottom: 14, fontSize: 10, color: '#1e1e1e', letterSpacing: '0.1em' }}>
            MANGOCHAT · LAMBDACS
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 52px', background: '#090909', height: '100vh', overflow: 'hidden' }}>
          <div style={{ width: '100%', maxWidth: 360, animation: 'sceneIn 0.5s ease-out 0.1s both' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
              <img src="/logo.png" alt="MangoChat" style={{ width: 50, height: 50, borderRadius: 13, objectFit: 'cover', boxShadow: '0 4px 20px #F59E0B28', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em' }}>MangoChat</div>
                <div style={{ fontSize: 10, color: '#2e2e2e', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Operator Panel</div>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em', marginBottom: 8 }}>Bienvenido de vuelta</h1>
              <p style={{ margin: 0, fontSize: 14, color: '#444' }}>Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, color: '#444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="erick@lambdacs.dev" required
                  style={{ width: '100%', background: '#131313', border: '1px solid #222', borderRadius: 10, padding: '13px 16px', fontSize: 14, color: '#f5f5f5', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = '#F59E0B55')}
                  onBlur={e => (e.target.style.borderColor = '#222')}
                />
              </div>

              <div style={{ marginBottom: 26 }}>
                <label style={{ display: 'block', fontSize: 10, color: '#444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  style={{ width: '100%', background: '#131313', border: '1px solid #222', borderRadius: 10, padding: '13px 16px', fontSize: 14, color: '#f5f5f5', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = '#F59E0B55')}
                  onBlur={e => (e.target.style.borderColor = '#222')}
                />
              </div>

              {error && (
                <div style={{ background: '#ff000010', border: '1px solid #ff000028', borderRadius: 8, padding: '11px 14px', fontSize: 13, color: '#ff6b6b', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%',
                background: loading ? '#5a3a00' : 'linear-gradient(135deg,#F59E0B,#D97706)',
                border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 700,
                color: loading ? '#888' : '#000', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 24px #F59E0B25',
                opacity: loading ? 0.6 : 1,
              }}>
                {loading ? 'Ingresando...' : 'Ingresar al panel'}
              </button>
            </form>

            <div style={{ marginTop: 36, paddingTop: 22, borderTop: '1px solid #141414', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#222' }}>MangoChat · Powered by Lambdacs</div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
