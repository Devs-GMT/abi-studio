'use client'

import { Contract } from 'ethers'
import { REGISTRY, REGISTRY_DEPLOYED } from '@/config/site'
import { getSignerFor } from '@/features/wallet'
import { REGISTRY_ABI } from '@/features/registry/abi'
import { registryIface } from '@/features/registry/read'
import { verifyBadge, type BadgeResult } from '@/features/registry/badge'
import { PanelDoc } from '@/types/panel'

export type PublishStep =
  | { step: 'idle' }
  | { step: 'wallet' }
  | { step: 'badge' }
  | { step: 'upload' }
  | { step: 'confirm'; cid: string }
  | { step: 'mining'; cid: string; hash: string }
  | { step: 'done'; id: number; cid: string; hash: string; badge: BadgeResult }
  | { step: 'error'; message: string; cid?: string; error?: unknown }

export async function uploadDoc(doc: PanelDoc): Promise<string> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(doc),
  })
  const j = (await res.json().catch(() => ({}))) as { cid?: string; error?: string; message?: string }
  if (!res.ok || !j.cid) {
    if (j.error === 'not_configured') throw new Error(j.message ?? 'IPFS upload is not configured on this deployment.')
    if (j.error === 'too_large') throw new Error('This panel is too large to upload (512 KB max).')
    if (j.error === 'invalid') throw new Error('The panel did not pass validation. Check the name (1–40 bytes).')
    throw new Error('Upload to IPFS failed. Try again.')
  }
  return j.cid
}

/**
 * Publish (or update) a panel. Order: wallet → badge check → IPFS → tx.
 * `existingId` set → `update(id, name, cid)` instead of `publish(...)`.
 */
export async function publishPanel(
  raw: PanelDoc,
  onStep: (s: PublishStep) => void,
  opts: { existingId?: number; reuseCid?: string } = {},
): Promise<void> {
  if (!REGISTRY_DEPLOYED) throw new Error('The PanelRegistry contract is not deployed yet.')
  const parsed = PanelDoc.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid panel')
  const doc = parsed.data

  onStep({ step: 'wallet' })
  const signer = await getSignerFor(REGISTRY.chainId)
  const publisher = await signer.getAddress()

  onStep({ step: 'badge' })
  const badge = await verifyBadge(doc.chainId, doc.address, publisher)

  let cid = opts.reuseCid
  if (!cid) {
    onStep({ step: 'upload' })
    cid = await uploadDoc(doc)
  }

  onStep({ step: 'confirm', cid })
  const registry = new Contract(REGISTRY.address, REGISTRY_ABI, signer)
  const tx =
    opts.existingId !== undefined
      ? await registry.update(opts.existingId, doc.name, cid)
      : await registry.publish(doc.address, doc.chainId, doc.name, cid, badge.badge)
  onStep({ step: 'mining', cid, hash: tx.hash })
  const receipt = await tx.wait()
  let id = opts.existingId ?? -1
  if (opts.existingId === undefined) {
    for (const log of receipt?.logs ?? []) {
      try {
        const p = registryIface.parseLog({ topics: [...log.topics], data: log.data })
        if (p?.name === 'Published') {
          id = Number(p.args.id)
          break
        }
      } catch {
        /* other logs */
      }
    }
  }
  if (id < 0) throw new Error('Published, but could not read the panel id from the receipt.')
  onStep({ step: 'done', id, cid, hash: tx.hash, badge })
}
