import { z } from 'zod'

export const ACCENTS = ['cyan', 'violet', 'amber', 'green'] as const
export type Accent = (typeof ACCENTS)[number]

export const FnMeta = z.object({
  label: z.string().max(48).optional(),
  note: z.string().max(200).optional(),
  hidden: z.boolean().optional(),
})
export type FnMeta = z.infer<typeof FnMeta>

export const PanelSection = z.object({
  id: z.string().min(1).max(40),
  title: z.string().max(32),
  items: z.array(z.string().max(300)).max(400),
})
export type PanelSection = z.infer<typeof PanelSection>

export const PanelDoc = z.object({
  v: z.literal(1),
  name: z
    .string()
    .min(1)
    .refine((s) => new TextEncoder().encode(s).length <= 40, 'Name must be 40 bytes or fewer'),
  description: z.string().max(280).default(''),
  chainId: z.union([z.literal(677), z.literal(968)]),
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  abi: z.array(z.record(z.string(), z.unknown())).max(400),
  accent: z.enum(ACCENTS).default('cyan'),
  sections: z.array(PanelSection).max(12),
  fn: z.record(z.string(), FnMeta).default({}),
  createdWith: z.literal('abi-studio@1'),
})
export type PanelDoc = z.infer<typeof PanelDoc>

/** Registry record (from PanelRegistry.getPanel), serialisable (no bigint). */
export interface PanelRecord {
  id: number
  publisher: string
  target: string
  chainId: number
  name: string
  cid: string
  badge: 0 | 1 | 2
  opens: number
  at: number
  hidden: boolean
}
