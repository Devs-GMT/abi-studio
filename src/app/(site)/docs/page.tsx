import type { Metadata } from 'next'
import Link from 'next/link'
import { CHAINS } from '@/config/chains'
import { LINKS, REGISTRY, REGISTRY_DEPLOYED } from '@/config/site'

export const metadata: Metadata = {
  title: 'Docs',
  description: 'How to load a contract, publish a panel, and how ABI Studio keeps you safe.',
}

const TOC = [
  ['get-abi', 'Getting your ABI'],
  ['load', 'Loading a contract'],
  ['use', 'Reading, writing, events'],
  ['publish', 'Publishing and sharing'],
  ['badges', 'Badges'],
  ['safety', 'Safety model'],
  ['networks', 'Networks'],
  ['terms', 'Terms'],
  ['privacy', 'Privacy'],
]

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 border-t border-line pt-10 text-h3">
      {children}
    </h2>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[13px] text-fg">{children}</code>
}

export default function DocsPage() {
  return (
    <div className="grid gap-12 px-4 py-16 md:grid-cols-12 md:border-x md:border-line md:px-12 md:py-24">
      <aside className="md:col-span-3">
        <nav aria-label="Docs" className="md:sticky md:top-24">
          <p className="mb-3 font-mono text-[12px] text-faint">Docs</p>
          <ul className="flex flex-col gap-1.5">
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-[14px] text-muted hover:text-fg">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <article className="flex max-w-[68ch] flex-col gap-5 text-[15px] leading-[26px] text-fg/90 md:col-span-9 [&_p]:text-muted [&_li]:text-muted">
        <h1 className="text-h2">Docs</h1>
        <p>
          ABI Studio turns any contract on BOT Chain into a working interface. You need two things: the contract address, and its ABI (the list of
          functions and events the contract exposes).
        </p>

        <H id="get-abi">Getting your ABI</H>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-fg">Remix:</strong> open the Solidity Compiler tab, compile, then click <em>ABI</em> under the contract to copy it. Or drop the
            file from <Code>artifacts/</Code>; we read its <Code>abi</Code> field.
          </li>
          <li>
            <strong className="text-fg">Hardhat:</strong> drop <Code>artifacts/contracts/YourContract.sol/YourContract.json</Code>.
          </li>
          <li>
            <strong className="text-fg">Foundry:</strong> drop <Code>out/YourContract.sol/YourContract.json</Code>.
          </li>
          <li>
            <strong className="text-fg">By hand:</strong> type one signature per line, e.g. <Code>function vote(uint8 option)</Code> or{' '}
            <Code>event Voted(address indexed voter, uint8 option)</Code>.
          </li>
          <li>
            <strong className="text-fg">Templates:</strong> ERC-20, ERC-721, Ownable and Launchpad are built in.
          </li>
        </ul>

        <H id="load">Loading a contract</H>
        <p>
          Paste the address and pick <em>Auto</em>: ABI Studio checks mainnet ({CHAINS[677].id}) and testnet ({CHAINS[968].id}) for code at that address. It
          warns you if the bytecode looks like a proxy, or if functions in your ABI don&apos;t seem to exist in the contract.
        </p>

        <H id="use">Reading, writing, events</H>
        <p>
          Read functions with no inputs load automatically. Write functions show exactly what will be sent (for example <Code>vote(2) with 0 BOT</Code>), plus
          a gas estimate. If the estimate fails, you see the decoded revert reason before you spend anything. Events stream live; use <em>Load past events</em>{' '}
          to look back (BOT Chain makes a block roughly every 0.7 seconds, so a day is about 130,000 blocks).
        </p>

        <H id="publish">Publishing and sharing</H>
        <p>
          <em>Publish</em> uploads your panel layout (ABI, names, notes, sections) to IPFS and records its CID in the PanelRegistry contract on BOT Chain
          mainnet. You get a link like <Code>/p/14</Code> and a QR code. Anyone can open it; reading needs no wallet.
        </p>
        {REGISTRY_DEPLOYED && (
          <p>
            Registry: <Code>{REGISTRY.address}</Code> on {CHAINS[REGISTRY.chainId].name}.
          </p>
        )}

        <H id="badges">Badges</H>
        <p>
          <strong className="text-fg">✓ Deployer</strong> means the publisher&apos;s address created the contract, according to the explorer&apos;s creation record.{' '}
          <strong className="text-fg">✓ Owner</strong> means the contract&apos;s <Code>owner()</Code> returns the publisher. Badges are re-checked every time a
          panel is shown; the value stored on-chain is only a claim.
        </p>

        <H id="safety">Safety model</H>
        <ul className="list-disc space-y-2 pl-5">
          <li>ABI Studio never holds your keys; every transaction is confirmed in your wallet.</li>
          <li>Nothing is ever sent automatically. You always see the exact call first.</li>
          <li>Payable and admin-looking functions (withdraw, transferOwnership, upgrade, mint…) get a red warning.</li>
          <li>Panels without a verified badge say: “Unverified panel. Only interact with contracts you trust.”</li>
        </ul>

        <H id="networks">Networks</H>
        <ul className="list-disc space-y-2 pl-5">
          {[CHAINS[677], CHAINS[968]].map((c) => (
            <li key={c.id}>
              {c.name}: chain ID <Code>{String(c.id)}</Code>, RPC <Code>{c.rpc}</Code>, explorer{' '}
              <a href={c.explorer} target="_blank" rel="noopener noreferrer" className="text-read hover:underline">
                {c.explorer.replace('https://', '')}
              </a>
            </li>
          ))}
          <li>
            Need test BOT?{' '}
            <a href={LINKS.faucet} target="_blank" rel="noopener noreferrer" className="text-read hover:underline">
              BOT Chain faucet
            </a>
            . More in the{' '}
            <a href={LINKS.botchainDocs} target="_blank" rel="noopener noreferrer" className="text-read hover:underline">
              BOT Chain docs
            </a>
            .
          </li>
        </ul>

        <H id="terms">Terms</H>
        <p>
          ABI Studio is provided as is, without warranty. It is an interface to contracts you choose; it does not audit them. You are responsible for the
          transactions you sign. Published panels are public and permanent on-chain; the curator may hide spam from the gallery.
        </p>

        <H id="privacy">Privacy</H>
        <p>
          There are no accounts and no tracking cookies. Recent contracts and drafts are stored only in your browser&apos;s local storage. Published panels go
          to IPFS and BOT Chain, which are public. If the opens counter is enabled, it stores only a number per panel.
        </p>

        <p className="border-t border-line pt-8">
          Ready? <Link href="/app" className="text-read hover:underline">Open the studio →</Link>
        </p>
      </article>
    </div>
  )
}
