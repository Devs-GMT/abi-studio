import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { Toaster } from '@/components/ui/toast'
import { SITE } from '@/config/site'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' })
const serif = Instrument_Serif({ variable: '--font-instrument-serif', subsets: ['latin'], weight: '400', display: 'swap' })

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { title: SITE.name, description: SITE.description, type: 'website' },
  twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
}

export const viewport: Viewport = {
  themeColor: '#08090A',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables pre-hidden reveal states; falls back to visible if GSAP never starts. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(d){d.classList.add('js-motion');setTimeout(function(){if(!d.dataset.revealReady)d.classList.add('motion-fallback')},3500)})(document.documentElement)",
          }}
        />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ctl focus:bg-read focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to main content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
