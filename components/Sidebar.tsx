'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuth, getUser } from '@/lib/auth'

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',       icon: GridIcon },
  { href: '/leads',         label: 'Leads',            icon: UsersIcon },
  { href: '/conversations', label: 'Conversaciones',   icon: ChatIcon },
]

export default function Sidebar() {
  const path   = usePathname()
  const router = useRouter()
  const user   = getUser()

  function logout() {
    clearAuth()
    router.replace('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#111111] border-r border-[#1E1E1E] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="MangoChat" className="w-8 h-8 rounded-lg object-cover" style={{ boxShadow: '0 2px 8px #F59E0B20' }} />
          <div>
            <span className="text-[15px] font-700 tracking-tight text-white" style={{ fontWeight: 700 }}>MangoChat</span>
            <div className="text-[10px] text-[#555] tracking-widest uppercase mt-0.5">Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                active
                  ? 'bg-amber-500/10 text-amber-400 font-600'
                  : 'text-[#888] hover:text-[#ccc] hover:bg-white/5'
              }`}
              style={{ fontWeight: active ? 600 : 400 }}
            >
              <Icon size={16} className={active ? 'text-amber-500' : 'text-current'} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-[#1E1E1E]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-600 text-amber-400" style={{ fontWeight: 600 }}>
            {user?.name?.[0]?.toUpperCase() || 'E'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-500 text-[#ddd] truncate" style={{ fontWeight: 500 }}>{user?.name || 'Erick'}</div>
            <div className="text-[10px] text-[#555] truncate">{user?.role || 'owner'}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-xs text-[#555] hover:text-[#f87171] transition-colors py-1 text-left"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  )
}

function GridIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function UsersIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 7.5c1.5 0 3 1.2 3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="11" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function ChatIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v6A1.5 1.5 0 0112.5 11H9l-3 3v-3H3.5A1.5 1.5 0 012 9.5v-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}
