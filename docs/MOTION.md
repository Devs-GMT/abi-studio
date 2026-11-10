# Motion (GSAP)

## 1. Setup

```ts
// src/lib/gsap.ts  (import only from "use client" files)
'use client'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP)
gsap.defaults({ ease: 'expo.out', duration: 0.9 })
export { gsap, ScrollTrigger, SplitText, Flip, useGSAP }
```

Pattern for every animated island:

```tsx
'use client'
export function Thing() {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(
      { full: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' },
      (ctx) => {
        if (ctx.conditions!.reduced) { /* gsap.set(final state); return */ }
        /* timelines here */
      },
    )
  }, { scope: root })
  return <div ref={root}>…</div>
}
```

The server-rendered HTML must already show the **final** state. Animations start from `gsap.from()` with `immediateRender` inside `useGSAP` (a layout effect), so there is no flash and no layout shift, and no-JS users see a complete page.

## 2. Vocabulary

| Name | Spec | Used by |
|---|---|---|
| `reveal` | from `{ y: 24, opacity: 0, rotateX: 8, transformPerspective: 800 }`, 0.9 s `expo.out`, stagger 0.06 | Section heads, card groups (ScrollTrigger `start: 'top 80%'`, `once: true`) |
| `lineReveal` | SplitText lines with `mask: 'lines'`, from `{ yPercent: 100 }`, 1.0 s `expo.out`, stagger 0.08 | Hero h1, closing CTA h2 only |
| `tick` | counter from 0 → value, 1.4 s `power2.out`, `snap: 1`, writes formatted text | Stats, footer `total()` |
| `glow` | result ring: opacity 0 → 1 → 0 over 0.9 s on `::after` (box-shadow is pre-rendered; we animate opacity) | Read result update |
| `shimmer` | a CSS gradient band moving across text with `background-position` (CSS keyframes; this is the one non-GSAP exception, it's a paint-only loop) | "Working…", "Waiting for wallet…" |
| `pulse` | ring scale 1 → 1.8, opacity .6 → 0, 1.2 s | Tx confirmed, live dot |
| `drift` | per-item yoyo: `x/y ±6px`, `scale 0.98–1.04`, 6–11 s random, `sine.inOut`, repeat −1 | Signature cloud |
| `flipSwap` | `Flip.getState` → change → `Flip.from(state, { duration: .6, ease: 'expo.out', absolute: true, onEnter: fade-in, onLeave: fade-out })` | Capabilities tabs, function cards assembling |

Durations: micro (hover, toggle) 150–200 ms in CSS transitions; UI 300 ms; reveals 900 ms. Nothing over 1.4 s except loops.

## 3. Hero demo window: timeline script

One `gsap.timeline({ repeat: -1, repeatDelay: 1.5 })`, about 16 s per loop, paused when off-screen (`ScrollTrigger.create({ onToggle: s => s.isActive ? tl.play() : tl.pause() })`) and when `document.hidden`.

| t (s) | Beat | Detail |
|---|---|---|
| 0.0 | Reset | Workspace empty; the status pill reads `Idle` |
| 0.3 | Cursor in | A fake cursor (SVG) floats to the address input (`cursor-float` idea from the reference) |
| 0.6 | Type address | 42 chars typed with `TextPlugin`-free approach: `textContent = full.slice(0, i)` in an `onUpdate` over 1.1 s, steps eased `none`; mono caret blinks |
| 1.9 | Network check | Pill: `Checking…` (shimmer) → `● BOT Chain · 677` green |
| 2.4 | ABI drop | An artifact chip `SnackPoll.json` slides from the top-right into the dropzone (y −40 → 0, rotate 4° → 0) |
| 3.0 | Checks | Three rows tick in: `✓ Contract has code` · `✓ ABI valid` · `✓ 9 functions, 2 events` (stagger 0.15) |
| 3.6 | Cards assemble | Six function cards Flip from a stacked deck (dropzone position) into the 2-column grid, stagger 0.07 |
| 4.8 | Read | Cursor clicks `Call` on `totalVotes() → uint256`; the button is pressed for 120 ms; result `0` → ticks to `1,284` with `glow` |
| 6.4 | Write | Switch to the Write tab (Flip underline). The `vote(uint8)` input types `2`, then `CallPreview: vote(2) with 0 BOT` appears |
| 7.4 | Send | Cursor clicks `Send transaction`; the status pill becomes `Waiting for wallet…` (shimmer, violet) |
| 9.0 | Confirmed | Pill: `Confirmed ✓` + `pulse` (green); a tx hash row slides in (`0x8f3a…c21e ↗`) and a decoded event row `Voted(voter, 2)` appears |
| 10.2 | Events | Switch to the Events tab; rows stream in from the top every 0.5 s (y −12 → 0, opacity), and the sparkline's last bar grows |
| 13.5 | Hold | The status pill returns to `Working…` with shimmer |
| 15.0 | Fade | The whole content fades to opacity 0 over 0.6 s, then the loop resets |

Data comes from `config/demo.ts` (a real-looking but explicitly sample contract). The window caption under it reads, in muted mono-sm: `Animated demo · sample contract`.

**Reduced motion:** render the 9.0 s frame statically (Write tab, preview, `Confirmed ✓`, decoded event) and no cursor.

## 4. Other sections

- **Announcement bar:** enters with y −100% → 0 (1.4 s `expo.out`, 0.4 s delay), like the reference's `header-banner-enter`.
- **Hero h1:** `lineReveal`. The rotating word `[ERC-20]` is a fixed-width mono pill (width animated with Flip as the content changes). Each word swaps on y: out −100%, in from 100%, every 1.8 s. It stops on `BOT Chain` after one cycle; reduced motion shows `BOT Chain` statically. Keep an `sr-only` sentence with the full static headline.
- **Contract strip:** CSS marquee (`translateX` keyframes, 40 s linear). Duplicate the list once, pause on hover/focus-within, and fall back to a static wrapping list on reduced motion.
- **Capabilities tabs:** `flipSwap` between tab sets. The 4 cards are keyed by stable ids so Flip can match shared positions. Tab underline also Flips.
- **Signature cloud:** ~28 mono chips absolutely positioned on a hand-tuned layout (positions in config, not random per load, so it never overlaps). Each gets a `drift` tween with random duration and delay. Chips whose type matches the hovered card (Smart inputs / Readable results / Live events) brighten to their semantic colour (opacity tween; the colour class is pre-applied). Pause when off-screen.
- **Feature row:** `reveal` with stagger 0.08. Screenshot inner content parallaxes `y: -16` over the card's scroll (`scrub: true`), transform only.
- **Use-case carousel:** autoplay every 5 s; ← / → move, Escape stops autoplay, hover/focus pauses. Slide = `xPercent` tween 0.7 s `expo.out`. A progress hairline under the active dot fills over 5 s (`scaleX`, origin left). Live region `aria-live="polite"` only while not autoplaying.
- **Dashboard:** tiles `tick` on enter; bars grow `scaleY` from 0 (origin bottom, stagger 0.03); the top-functions list `reveal`s.
- **Footer mini-panel:** `total()` ticks on first view; the block number updates every 2 s with a 120 ms opacity dip; the live dot `pulse`s each new block.

## 5. Performance rules

- Animate only `transform` and `opacity` (plus the CSS `background-position` shimmer). No `filter`, `width/height/top/left`, or box-shadow tweens.
- `will-change: transform` only during active tweens (`onStart`/`onComplete`), never globally.
- Kill or pause all loops off-screen. Every `ScrollTrigger` is created inside `useGSAP` so it's reverted on unmount.
- Don't animate the LCP element's opacity from 0 on first load. The hero h1 uses a line mask (`yPercent`), so the text node is painted immediately.
- Lazy-mount below-the-fold animated islands with `next/dynamic` (`ssr: true`, so the markup still prints).
