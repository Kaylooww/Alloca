import type { Metadata, Viewport } from 'next'

import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@/lib/constants/app'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfdfc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1a17' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <a href="#main" className="sr-only sr-only-focusable">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
