'use client'

import { ArrowUpRight, Download } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { ButtonLink, buttonClass } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { siteUrl } from '@/config/site'
import { cn } from '@/lib/cn'

export function panelUrl(id: number | string) {
  return `${siteUrl()}/p/${id}`
}

export function QrCode({ value, className, size = 168 }: { value: string; className?: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#EDEFF3', light: '#00000000' } })
      .then((s) => alive && setSvg(s))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [value])
  return (
    <div
      role="img"
      aria-label={`QR code for ${value}`}
      className={cn('shrink-0 rounded-ctl border border-line bg-bg p-2 [&_svg]:h-full [&_svg]:w-full', className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  )
}

export function ShareCard({ id, name }: { id: number; name: string }) {
  const url = panelUrl(id)
  const tweet = `I made a panel for ${name} on @BOTChain_ai with ABI Studio → ${url}`

  const downloadPng = async () => {
    try {
      const data = await QRCode.toDataURL(url, { margin: 2, width: 720, color: { dark: '#08090A', light: '#FFFFFF' } })
      const a = document.createElement('a')
      a.href = data
      a.download = `abi-studio-panel-${id}.png`
      a.click()
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <QrCode value={url} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-muted">Share link</p>
        <p className="mt-1 flex items-center gap-1 rounded-ctl border border-line-2 bg-bg py-1.5 pl-3 pr-1 font-mono text-[13px]">
          <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
          <CopyButton value={url} label="Copy link" className="ml-auto" />
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink href={`/p/${id}`} size="sm">
            Open panel
          </ButtonLink>
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(tweet)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass('ghost', 'sm')}
          >
            Post on X <ArrowUpRight />
          </a>
          <button type="button" onClick={downloadPng} className={buttonClass('subtle', 'sm')}>
            <Download /> QR as PNG
          </button>
        </div>
      </div>
    </div>
  )
}
