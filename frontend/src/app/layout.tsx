import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LLMify - AI Engine Optimization Platform',
  description: 'The new AEO starts here. Track your brand visibility across ChatGPT, Gemini, Claude & Perplexity.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

