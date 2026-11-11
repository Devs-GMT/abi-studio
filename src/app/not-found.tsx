import Link from 'next/link'
import { ButtonLink } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Link href="/" aria-label="ABI Studio home" className="mb-10">
        <Logo />
      </Link>
      <p className="font-mono text-[13px] text-danger">✗ Reverted: NotFound()</p>
      <h1 className="mt-4 text-h3">This page doesn&apos;t exist.</h1>
      <p className="mt-2 text-[14px] text-muted">Check the URL, or start from a contract instead.</p>
      <div className="mt-8 flex gap-2">
        <ButtonLink href="/app">Open the studio</ButtonLink>
        <ButtonLink href="/" variant="ghost">
          Home
        </ButtonLink>
      </div>
    </main>
  )
}
