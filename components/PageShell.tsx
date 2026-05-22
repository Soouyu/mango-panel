'use client'
import Sidebar from './Sidebar'
import { useProtected } from '@/hooks/useProtected'

export default function PageShell({ children }: { children: React.ReactNode }) {
  useProtected()
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
