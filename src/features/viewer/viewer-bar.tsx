import Link from 'next/link'
import { ButtonLink } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { ConnectButton } from '@/features/wallet'

export function ViewerBar() {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur md:px-6">
      <Link href="/" aria-label="ABI Studio home" className="mr-auto">
        <Logo />
      </Link>
      <Link href="/app/gallery" className="hidden text-[13px] text-muted hover:text-fg sm:inline">
        Gallery
      </Link>
      <ConnectButton />
      <ButtonLink href="/app" size="sm" className="hidden sm:inline-flex">
        Open the studio
      </ButtonLink>
    </div>
  )
}
