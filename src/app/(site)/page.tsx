import { Capabilities } from '@/sections/capabilities/capabilities'
import { ClosingCta } from '@/sections/closing-cta/closing-cta'
import { ContractStrip } from '@/sections/contract-strip/contract-strip'
import { Dashboard } from '@/sections/dashboard/dashboard'
import { FeatureRow } from '@/sections/feature-row/feature-row'
import { Hero } from '@/sections/hero/hero'
import { LiveBoard } from '@/sections/live-board/live-board'
import { RevealController } from '@/sections/motion/reveal-controller'
import { SectionEyebrow } from '@/components/ui/misc'
import { Section, SectionHead } from '@/sections/shared'
import { SignatureCloud } from '@/sections/signature-cloud/signature-cloud'
import { UseCases } from '@/sections/use-cases/use-cases'

export default function HomePage() {
  return (
    <>
      {/* 1 · Hero */}
      <Hero />

      {/* 2 · BOT Chain, live */}
      <LiveBoard />

      {/* 3 · Contract strip */}
      <ContractStrip />

      {/* 4 · Capabilities */}
      <Section id="capabilities" label="Capabilities" className="px-4 py-20 md:px-12 md:py-28">
        <SectionHead
          signature="balanceOf(address)"
          title="Everything your contract can do, one click away"
          intro="Every function in your ABI becomes a card with the right inputs and a readable result."
          className="mb-12"
        />
        <Capabilities />
      </Section>

      {/* 5 · Underpinned by your ABI */}
      <Section label="Underpinned by your ABI" className="px-4 py-20 md:px-12 md:py-28">
        <SectionHead
          signature="supportsInterface(bytes4)"
          title="Underpinned by your ABI"
          intro="ABI Studio reads the types, so you don’t have to write a frontend to use them."
          className="mb-12"
          align="center"
        />
        <SignatureCloud />
      </Section>

      {/* 6 · Feature row */}
      <Section label="Features" className="px-4 py-20 md:px-12 md:py-24">
        <SectionHead signature="publish(address,uint32,string,string,uint8)" title="Small things that make a panel usable" className="mb-10" align="stack" />
        <FeatureRow />
      </Section>

      {/* 7 · Use cases */}
      <Section label="Use cases" className="px-4 py-16 md:px-12 md:py-20">
        <SectionEyebrow signature="vote(uint8)" className="mb-2" />
        <UseCases />
      </Section>

      {/* 8 · Dashboard */}
      <Section label="Your contract at a glance" className="px-4 py-20 md:px-12 md:py-28">
        <SectionHead
          signature="Transfer(address,address,uint256)"
          kind="event"
          title="Your contract at a glance"
          intro="Every panel’s Info and Events tabs add up to a picture of how the contract is used."
          className="mb-12"
          align="center"
        />
        <Dashboard />
      </Section>

      {/* 9 · Closing CTA */}
      <Section label="Get started" className="overflow-hidden px-4 py-28 md:px-12 md:py-40">
        <ClosingCta />
      </Section>
      <RevealController />
    </>
  )
}
