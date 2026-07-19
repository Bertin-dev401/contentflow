import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ContentFlow',
  description: 'Stay consistent. Post better.',
  // Prevent indexing during MVP — remove when ready to launch
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        {/* Prevent extension fingerprinting */}
        <meta name="referrer" content="no-referrer" />
      </head>
      <body>{children}</body>
    </html>
  )
}
