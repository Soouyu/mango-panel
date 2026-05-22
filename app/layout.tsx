import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MangoChat — Panel',
  description: 'Omnichannel sales agent operator panel',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#080808',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-[#080808] text-[#F5F5F5] antialiased" style={{ fontFamily: "'Sora', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
