'use client'

import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'

/**
 * One controller for every `[data-reveal]` element on the site.
 * CSS pre-hides them (only with JS + motion allowed, see globals.css) so there is no flash;
 * this batches them into the "reveal" tween from MOTION.md as they scroll in.
 */
export function RevealController() {
  useGSAP(() => {
    const root = document.documentElement
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      // Client-side navigation can arrive after the CSS fallback kicked in: hide explicitly.
      gsap.set('[data-reveal]', { autoAlpha: 0 })
      root.classList.remove('motion-fallback')
      const triggers = ScrollTrigger.batch('[data-reveal]', {
        start: 'top 85%',
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { autoAlpha: 0, y: 24, rotateX: 8, transformPerspective: 800 },
            { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, overwrite: true },
          ),
      })
      // Anything already above the fold on load.
      ScrollTrigger.refresh()
      return () => triggers.forEach((t) => t.kill())
    })
    root.dataset.revealReady = '1'
    return () => mm.revert()
  })
  return null
}
