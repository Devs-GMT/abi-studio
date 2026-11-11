import { Capabilities } from '@/sections/capabilities/capabilities'
import { ClosingCta } from '@/sections/closing-cta/closing-cta'
import { ContractStrip } from '@/sections/contract-strip/contract-strip'
import { Dashboard } from '@/sections/dashboard/dashboard'
import { DemoWindow } from '@/sections/demo-window/demo-window'
import { FeatureRow } from '@/sections/feature-row/feature-row'
import { Hero } from '@/sections/hero/hero'
import { RevealController } from '@/sections/motion/reveal-controller'
import { Section, SectionHead } from '@/sections/shared'
import { SignatureCloud } from '@/sections/signature-cloud/signature-cloud'
import { UseCases } from '@/sections/use-cases/use-cases'

export default function HomePage() {
  return (
    <>
      {/* 1 · Hero */}
      <Hero />

      {/* 2 · See your panel at work */}
      <Section label="See your panel at work" className="px-4 pb-20 pt-14 md:px-12 md:pb-24 md:pt-16">
        <SectionHead signature="getPanel(uint256)" title="See your panel at work" className="mb-10" />
        <DemoWindow />
      </Section>

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
        />
        <SignatureCloud />
      </Section>

      {/* 6 · Feature row */}
      <Section label="Features" className="px-4 py-20 md:px-12 md:py-24">
        <SectionHead signature="publish(address,uint32,string,string,uint8)" title="Small things that make a panel usable" className="mb-10" />
        <FeatureRow />
      </Section>

      {/* 7 · Use cases */}
      <Section label="Use cases" className="px-4 py-20 md:px-12 md:py-28">
        <SectionHead
          signature="vote(uint8)"
          title="Built for the moment before the frontend exists"
          intro="No quotes, no logos — just the jobs people use a panel for."
          className="mb-10"
        />
        <UseCases />
      </Section>

      {/* 8 · Dashboard */}
      <Section label="Your contract at a glance" className="px-4 py-20 md:px-12 md:py-28">
        <SectionHead
          signature="Transfer(address,address,uint256)"
          kind="event"
          title="Your contract at a glance"
          intro="Every panel’s Info and Events tabs add up to a picture of how the contract is used."
          className="mb-10"
        />
        <Dashboard />
      </Section>

      {/* 9 · Closing CTA */}
      <Section label="Get started" className="px-4 py-24 md:px-12 md:py-32">
        <ClosingCta />
      </Section>
      <RevealController />
    </>
  )
}
