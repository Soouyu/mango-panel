'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { use } from 'react'
import Sidebar from '@/components/Sidebar'
import { useProtected } from '@/hooks/useProtected'

const FlowBuilder = dynamic(() => import('@/components/FlowBuilder'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#080808]">
      <div className="text-sm text-[#444]">Cargando editor...</div>
    </div>
  ),
})

function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  useProtected()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col overflow-hidden">
        {/* Breadcrumb bar */}
        <div className="shrink-0 flex items-center gap-2 px-5 h-12 border-b border-[#1a1a1a] bg-[#0a0a0a]">
          <Link href="/channels" className="text-xs text-[#555] hover:text-[#888] transition-colors">
            Canales
          </Link>
          <span className="text-[#333] text-xs">/</span>
          <span className="text-xs text-[#888]">Constructor de flujo</span>
        </div>

        {/* Full-height canvas */}
        <div className="flex-1 overflow-hidden">
          <FlowBuilder channelId={id} channelName="Plan Flujo" />
        </div>
      </div>
    </div>
  )
}

export default FlowPage
