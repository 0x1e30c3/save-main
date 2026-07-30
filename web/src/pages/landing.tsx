import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { LogoMark } from '@/components/brand/logo'
import { useT } from '@/lib/i18n'
import { ScrollReveal } from '@/components/brand/scroll-reveal'
import { Button } from '@/components/ui/button'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const CIRCLES = [
  { id: 'left-mid', cx: 0, cy: 543.9, r: 550, g: '1,3', rot: 0 },
  { id: 'right-mid', cx: 1440, cy: 543.9, r: 550, g: '1,3', rot: 180 },
  { id: 'left-top', cx: 2.5, cy: -365, r: 805, g: '2', rot: -45 },
  { id: 'right-top', cx: 1437.5, cy: -365, r: 805, g: '2', rot: -45 },
  { id: 'left-bottom', cx: 2.5, cy: 1245, r: 805, g: '2,4', rot: 45 },
  { id: 'right-bottom', cx: 1437.5, cy: 1245, r: 805, g: '2,4', rot: 45 },
  { id: 'center-top', cx: 720, cy: 15, r: 425, g: '3,4', rot: -45 },
  { id: 'center-bottom', cx: 720, cy: 865, r: 425, g: '1,3,4', rot: 45 },
]

export function Landing() {
  const t = useT()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const solutionRef = useRef<HTMLElement | null>(null)

  const [activeNav, setActiveNav] = useState('top')

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const circles = gsap.utils.toArray<SVGCircleElement>('[data-ed-canvas] circle', root)
      const sections = gsap.utils.toArray<HTMLElement>('[data-ed-section]', root)
      const topnav = root.querySelector<HTMLElement>('[data-ed-topnav]')

      const mm = gsap.matchMedia(root)
      mm.add(
        {
          isDesktop: '(min-width: 1025px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop, reduceMotion } = context.conditions as {
            isDesktop: boolean
            reduceMotion: boolean
          }

          // ---- Lenis smooth scroll ----
          let lenis: Lenis | undefined
          let raf: ((t: number) => void) | undefined
          if (!reduceMotion) {
            lenis = new Lenis()
            lenis.on('scroll', ScrollTrigger.update)
            raf = (t: number) => lenis?.raf(t * 1000)
            gsap.ticker.add(raf)
            gsap.ticker.lagSmoothing(0)
          }

          // ---- Top nav scrolled state ----
          if (topnav) {
            ScrollTrigger.create({
              start: 40,
              onEnter: () => {
                topnav.dataset.scrolled = 'true'
              },
              onLeaveBack: () => {
                topnav.dataset.scrolled = 'false'
              },
            })
          }

          // ---- Per-section circle activation + nav highlight ----
          let activeGroup = 0
          const activate = (group: number) => {
            if (group === activeGroup) return
            activeGroup = group
            let onIndex = 0
            circles.forEach((circle) => {
              const on = (circle.dataset.group ?? '').split(',').includes(String(group))
              gsap.to(circle, {
                strokeDashoffset: on ? 0 : 1,
                duration: reduceMotion ? 0 : 1.6,
                delay: reduceMotion || !on ? 0 : 0.09 * onIndex++,
                ease: 'power2.inOut',
                overwrite: 'auto',
              })
            })
          }

          sections.forEach((section, i) => {
            ScrollTrigger.create({
              trigger: section,
              start: 'top 55%',
              end: 'bottom 55%',
              onToggle: (self) => {
                if (self.isActive) {
                  activate(i + 1)
                  setActiveNav(section.id)
                }
              },
            })

            if (reduceMotion) return

            const headline = section.querySelector('[data-ed-headline]')
            const narrative = section.querySelector('[data-ed-narrative]')
            if (headline || narrative) {
              gsap.from([headline, narrative], {
                autoAlpha: 0,
                y: 56,
                duration: 1.1,
                stagger: 0.16,
                ease: 'power3.out',
                scrollTrigger: { trigger: section, start: 'top 72%' },
              })
            }
          })

          // ---- Hero Hand Parallax + Hover Parallax ----
          const hero = heroRef.current
          if (hero) {
            const heroInner = hero.querySelector('[data-ed-hero-inner]')
            const heroFrame = hero.querySelector('[data-ed-hero-frame]')
            const heroBg = hero.querySelector('[data-ed-bg]')

            if (heroInner) {
              gsap.from(heroInner.children, {
                y: 22,
                autoAlpha: 0,
                duration: 0.9,
                stagger: 0.12,
                ease: 'power2.out',
                delay: 0.2,
              })
            }

            if (heroFrame) {
              const frameRect = heroFrame.querySelector('rect')
              if (frameRect) {
                gsap.from(frameRect, {
                  strokeDashoffset: 1,
                  duration: 1.4,
                  ease: 'power2.out',
                })
              }

              const parallax = gsap.timeline({
                scrollTrigger: {
                  trigger: hero,
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 0.6,
                },
              })
              parallax.to(heroFrame, { y: -40, autoAlpha: 0.35, ease: 'none' }, 0)
            }

            if (isDesktop && heroBg) {
              gsap.set(heroBg, { scale: 1.1, transformOrigin: 'center center' })
              const xTo = gsap.quickTo(heroBg, 'x', { duration: 0.8, ease: 'power3.out' })
              const yTo = gsap.quickTo(heroBg, 'y', { duration: 0.8, ease: 'power3.out' })
              const clamp = gsap.utils.clamp(-1, 1)

              const onMove = (e: PointerEvent) => {
                const rect = hero.getBoundingClientRect()
                const nx = clamp(gsap.utils.mapRange(0, rect.width, -1, 1, e.clientX - rect.left))
                const ny = clamp(gsap.utils.mapRange(0, rect.height, -1, 1, e.clientY - rect.top))
                xTo(nx * 14)
                yTo(ny * 10)
              }
              const onLeave = () => {
                xTo(0)
                yTo(0)
              }

              hero.addEventListener('pointermove', onMove)
              hero.addEventListener('pointerleave', onLeave)
              return () => {
                hero.removeEventListener('pointermove', onMove)
                hero.removeEventListener('pointerleave', onLeave)
              }
            }
          }

          // ---- Solution Background Parallax ----
          const solution = solutionRef.current
          if (solution && !reduceMotion) {
            const background = solution.querySelector('[data-solution-background]')
            if (background) {
              gsap.fromTo(
                background,
                { yPercent: -8 },
                {
                  yPercent: 8,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: solution,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.6,
                  },
                },
              )
            }
          }

          return () => {
            if (raf) gsap.ticker.remove(raf)
            lenis?.destroy()
          }
        },
        { scope: rootRef },
      )
    },
    { scope: rootRef },
  )

  return (
    <div
      ref={rootRef}
      className="relative min-h-svh bg-[#1d2215] text-[#f5f3ea] font-sans selection:bg-[#ff409f]/30 selection:text-white"
    >
      {/* Background Section Decorative Rings */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" data-ed-canvas aria-hidden="true">
        <svg
          className="block h-full w-full"
          viewBox="0 0 1440 880"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {CIRCLES.map((c) => (
            <circle
              key={c.id}
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              vectorEffect="non-scaling-stroke"
              data-group={c.g}
              transform={`rotate(${c.rot} ${c.cx} ${c.cy})`}
              className="fill-none stroke-[#f5f3ea]/20 stroke-[0.5px]"
            />
          ))}
        </svg>
      </div>

      {/* Header / Top Navigation */}
      <header
        className="fixed inset-x-0 top-0 z-[70] flex items-center justify-between gap-2 px-6 py-3 text-[#f5f3ea] transition-all duration-300 border-b border-transparent data-[scrolled=true]:border-[#f5f3ea]/10 data-[scrolled=true]:bg-[#1d2215]/85 data-[scrolled=true]:backdrop-blur-md sm:py-4 md:px-12"
        data-ed-topnav
      >
        <Link className="flex items-center gap-2.5 outline-none" to="/">
          <LogoMark size={28} className="text-[#f5f3ea]" />
          <span className="text-xl font-bold tracking-tight">Save</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden items-center gap-6 text-sm font-semibold tracking-[0.02em] text-[#f5f3ea]/70 sm:flex">
            <a
              href="#problem"
              className={`hover:text-[#f5f3ea] transition-colors ${activeNav === 'problem' ? 'text-[#f5f3ea]' : ''}`}
            >
              {t('landing.navCompare')}
            </a>
            <a
              href="#solution"
              className={`hover:text-[#f5f3ea] transition-colors ${activeNav === 'solution' ? 'text-[#f5f3ea]' : ''}`}
            >
              {t('landing.navHow')}
            </a>
            <a
              href="#protocols"
              className={`hover:text-[#f5f3ea] transition-colors ${activeNav === 'protocols' ? 'text-[#f5f3ea]' : ''}`}
            >
              {t('landing.navProtocols')}
            </a>
          </nav>
          <Button asChild size="sm" className="bg-[#f5f3ea] text-[#1d2215] hover:bg-white border-none font-semibold rounded-lg px-5">
            <Link to="/app">{t('landing.cta')}</Link>
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT SECTION */}
      <main id="main-content" className="relative z-10 overflow-x-clip">
        {/* HERO SECTION */}
        <section
          ref={heroRef}
          className="relative isolate z-20 grid min-h-svh place-items-center overflow-hidden px-5 pb-8 pt-24 sm:px-8 sm:pb-10 sm:pt-28"
          id="top"
        >
          <img
            data-ed-bg
            className="absolute inset-0 z-[-3] h-full w-full object-cover will-change-transform opacity-40 mix-blend-luminosity"
            src="/assets/section1-bg.jpg"
            alt=""
          />
          <div
            className="pointer-events-none absolute inset-0 z-[-2] bg-[radial-gradient(48%_56%_at_50%_47%,rgba(29,34,21,0.6),rgba(29,34,21,0.1)_76%),linear-gradient(to_bottom,rgba(29,34,21,0.6),transparent_22%,transparent_60%,rgba(29,34,21,0.7))]"
            aria-hidden="true"
          />

          {/* Parallel Hands decoration */}
          <div className="pointer-events-none absolute inset-0 z-[-1]" aria-hidden="true">
            <div className="absolute left-0 top-1/2 origin-left -translate-y-[46%] max-lg:-translate-y-[58%] max-lg:scale-90 max-[620px]:opacity-40">
              <img
                className="block h-auto w-[min(46vw,600px)] will-change-transform [filter:drop-shadow(0_26px_40px_rgba(0,0,0,0.55))] max-lg:w-[62vw] max-[620px]:w-[76vw]"
                src="/assets/left-hand.png"
                alt=""
              />
            </div>
            <div className="absolute right-0 top-1/2 origin-right -translate-y-[40%] max-lg:-translate-y-[16%] max-lg:scale-90 max-[620px]:opacity-40">
              <img
                className="block h-auto w-[min(46vw,600px)] will-change-transform [filter:drop-shadow(0_26px_40px_rgba(0,0,0,0.55))] max-lg:w-[62vw] max-[620px]:w-[76vw]"
                src="/assets/right-hand.png"
                alt=""
              />
            </div>
          </div>

          {/* Hero Content Frame Box */}
          <div
            data-ed-hero-frame
            className="relative flex min-h-[clamp(500px,72svh,640px)] w-full max-w-[480px] bg-[radial-gradient(115%_90%_at_50%_45%,rgba(29,34,21,0.7),rgba(29,34,21,0.2)_100%)] px-6 py-7 text-[#f5f3ea] [text-shadow:0_1px_18px_rgba(0,0,0,0.6)] sm:px-9 sm:py-9 lg:px-10 lg:py-11"
          >
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 340 452"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect
                x="0.5"
                y="0.5"
                width="339"
                height="451"
                pathLength={1}
                strokeDasharray={1}
                className="fill-none stroke-[#f5f3ea]/40"
              />
            </svg>
            <div data-ed-hero-inner className="relative flex w-full flex-col">
              <h1
                className="m-0 mt-2 flex flex-col text-[clamp(2.1rem,8vw,3.6rem)] font-bold leading-[0.98] tracking-[-0.03em] text-[#f5f3ea] sm:mt-4 sm:text-[clamp(2.1rem,4.4vw,3.6rem)]"
                id="ed-hero-title"
              >
                <span>Confidential</span>
                <span>USDC</span>
                <span>Savings</span>
              </h1>
              <p className="mt-6 max-w-[28ch] text-sm font-semibold uppercase leading-[1.55] tracking-[0.08em] text-[#f5f3ea]/70">
                {t('landing.heroTitle')}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#f5f3ea] px-3 text-center text-sm font-bold tracking-[0.02em] text-[#1d2215] transition-opacity hover:opacity-85 sm:px-5"
                  to="/app"
                >
                  {t('landing.cta')}
                </Link>
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#f5f3ea]/50 bg-transparent px-3 text-center text-sm font-bold leading-tight tracking-[0.02em] text-[#f5f3ea] transition-opacity hover:opacity-85 sm:px-5"
                  href="#solution"
                >
                  {t('landing.navHow')}
                </a>
              </div>
              <ul className="mt-auto grid list-none gap-0.5 pt-5 sm:pt-6">
                <li>
                  <a href="#problem" className="flex items-baseline justify-between border-b border-transparent py-2 text-[15px] font-bold text-[#f5f3ea]/60 hover:text-white sm:py-2.5">
                    <span>{t('landing.navCompare')}</span>
                    <span className="text-xs font-semibold text-[#f5f3ea]/40">I</span>
                  </a>
                </li>
                <li>
                  <a href="#solution" className="flex items-baseline justify-between border-b border-transparent py-2 text-[15px] font-bold text-[#f5f3ea]/60 hover:text-white sm:py-2.5">
                    <span>{t('landing.navHow')}</span>
                    <span className="text-xs font-semibold text-[#f5f3ea]/40">II</span>
                  </a>
                </li>
                <li>
                  <a href="#protocols" className="flex items-baseline justify-between border-b border-transparent py-2 text-[15px] font-bold text-[#f5f3ea]/60 hover:text-white sm:py-2.5">
                    <span>{t('landing.navProtocols')}</span>
                    <span className="text-xs font-semibold text-[#f5f3ea]/40">III</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* PROBLEM STATEMENT SECTION */}
        <section
          className="relative z-20 flex min-h-svh items-center bg-[#f0eeea] px-[clamp(20px,5vw,72px)] py-24 text-[#20261a] sm:py-28"
          id="problem"
          data-ed-section
        >
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[0.88fr_1fr] lg:gap-20">
            {/* Ledger Decorative Sketch */}
            <div className="relative min-h-[220px] lg:min-h-[420px]" aria-hidden="true">
              <svg
                className="absolute left-1/2 top-1/2 h-[min(62vw,500px)] w-[min(78vw,640px)] -translate-x-1/2 -translate-y-1/2 overflow-visible text-[#4c5d34] lg:left-[44%]"
                viewBox="0 0 640 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g className="opacity-80" vectorEffect="non-scaling-stroke">
                  <path d="M92 275C164 208 247 173 341 169C429 166 493 195 556 254" className="stroke-[#9c7420]/75" strokeWidth="2" strokeDasharray="7 10" />
                  <path d="M118 345C195 279 278 247 367 249C446 251 508 282 558 337" className="stroke-[#4c5d34]/35" strokeWidth="1.5" strokeDasharray="5 12" />
                  <rect x="224" y="148" width="190" height="190" rx="22" className="stroke-[#4c5d34]" strokeWidth="2.2" transform="rotate(-17 319 243)" />
                  <rect x="259" y="183" width="120" height="120" rx="18" className="stroke-[#4c5d34]/60" strokeWidth="1.8" transform="rotate(-17 319 243)" />
                  <g className="stroke-[#9c7420]" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="320" cy="236" r="43" strokeWidth="2" />
                    <path d="M279 250L365 205" strokeWidth="9" className="stroke-[#f0eeea]" />
                    <path d="M273 253L370 202" strokeWidth="2.8" />
                    <path d="M270 271L367 220" strokeWidth="2.8" />
                  </g>
                  <circle cx="159" cy="275" r="42" className="stroke-[#4c5d34]" strokeWidth="2" />
                  <circle cx="159" cy="275" r="16" className="stroke-[#9c7420]" strokeWidth="2" />
                  <circle cx="498" cy="256" r="47" className="stroke-[#4c5d34]" strokeWidth="2" />
                  <circle cx="498" cy="256" r="18" className="stroke-[#9c7420]" strokeWidth="2" />
                  <path d="M159 275L270 224M374 229L498 256M356 284L533 359M260 278L100 354" className="stroke-[#4c5d34]/40" strokeWidth="1.6" />
                </g>
              </svg>
            </div>

            {/* Problem Statement Content */}
            <div className="max-w-[620px] lg:justify-self-end">
              <ScrollReveal
                containerClassName="max-w-lg"
                textClassName="text-[clamp(1.8rem,4vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.03em] text-[#20261a]"
                baseRotation={0}
                blurStrength={3}
              >
                Public wallets were never designed for private business.
              </ScrollReveal>

              <div className="mt-10 space-y-7 text-[clamp(1.05rem,1.55vw,1.25rem)] font-semibold leading-[1.42] text-[#20261a]/85">
                <ScrollReveal textClassName="max-w-[32ch]" baseRotation={1.5} blurStrength={2}>
                  Every time someone pays your wallet, they can potentially see your entire income, payment history, and splits on a public explorer.
                </ScrollReveal>
                <ScrollReveal textClassName="max-w-[34ch] text-[#333e22]" baseRotation={1.2} blurStrength={2}>
                  Save runs confidentially on iExec Nox enclaves (TEE), securing your splits, assets, and rule history in a private vault.
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTION GRID CARDS SECTION */}
        <section
          ref={solutionRef}
          className="relative z-20 min-h-[85vh] overflow-hidden bg-[#1d2215] text-[#20261a] lg:h-[85vh]"
          id="solution"
          data-ed-section
        >
          <div className="absolute -inset-y-[10%] inset-x-0 will-change-transform opacity-30 mix-blend-luminosity" data-solution-background aria-hidden="true">
            <img className="h-full w-full object-cover" src="/assets/section3-bg.webp" alt="" />
          </div>
          <div className="absolute inset-0 bg-[#f0eeea]/10 mix-blend-screen" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(29,34,21,0.1),rgba(29,34,21,0.3)),radial-gradient(70%_60%_at_20%_12%,rgba(245,243,232,0.35),transparent_58%)]"
            aria-hidden="true"
          />

          <div className="relative grid min-h-[85vh] grid-cols-1 gap-4 p-5 sm:p-6 md:grid-cols-2 md:gap-4 md:p-8 lg:block lg:h-[85vh] lg:p-0">
            <h2 className="sr-only">How Save Protects You</h2>

            {/* Overlapping Olio-inspired cards containing Save features */}
            <article className="flex min-h-[140px] items-start bg-[#f0eeea] px-6 py-6 shadow-xl lg:absolute lg:min-h-0 lg:w-[350px] lg:left-[8vw] lg:top-[10%]">
              <p className="text-xl font-bold leading-[1.1] tracking-[-0.02em] max-w-[14ch]">
                <span className="block text-xs font-semibold text-[#9c7420] uppercase tracking-[0.1em] mb-2">I. Nox Protocol</span>
                Confidential savings split secured inside TEE hardware enclaves.
              </p>
            </article>

            <article className="flex min-h-[140px] items-start bg-[#f0eeea] px-6 py-6 shadow-xl lg:absolute lg:min-h-0 lg:w-[300px] lg:left-[45vw] lg:top-[20%]">
              <p className="text-lg font-bold leading-[1.15] tracking-[-0.02em] max-w-[15ch]">
                <span className="block text-xs font-semibold text-[#9c7420] uppercase tracking-[0.1em] mb-2">II. Default Saving</span>
                Splits are processed on-chain, routing rules securely without public ledger exposure.
              </p>
            </article>

            <article className="flex min-h-[140px] items-start bg-[#f0eeea] px-6 py-6 shadow-xl lg:absolute lg:min-h-0 lg:w-[320px] lg:right-[8vw] lg:top-[35%]">
              <p className="text-lg font-bold leading-[1.15] tracking-[-0.02em] max-w-[14ch]">
                <span className="block text-xs font-semibold text-[#9c7420] uppercase tracking-[0.1em] mb-2">III. Seamless Integration</span>
                Clients pay through standard Sepolia USDC links with no complex sign-up.
              </p>
            </article>

            <article className="flex min-h-[140px] items-start bg-[#f0eeea] px-6 py-6 shadow-xl lg:absolute lg:min-h-0 lg:w-[480px] lg:left-[22vw] lg:bottom-[15%]">
              <p className="text-base font-bold leading-[1.2] tracking-[-0.02em] max-w-[32ch]">
                <span className="block text-xs font-semibold text-[#9c7420] uppercase tracking-[0.1em] mb-2">IV. Obfuscated Logs</span>
                Incoming events omit amounts. No third parties can parse or reverse-engineer your financial balances.
              </p>
            </article>

            <article className="flex min-h-[140px] items-start bg-[#f0eeea] px-6 py-6 shadow-xl lg:absolute lg:min-h-0 lg:w-[290px] lg:left-[66vw] lg:bottom-[8%]">
              <p className="text-base font-bold leading-[1.2] tracking-[-0.02em] max-w-[16ch]">
                <span className="block text-xs font-semibold text-[#9c7420] uppercase tracking-[0.1em] mb-2">V. Multi-Yield Routing</span>
                Earn automatically from Nox Vault, Aave, or Uniswap V2 pools.
              </p>
            </article>
          </div>
        </section>

        {/* THREE STEPS TIMELINE SECTION */}
        <section
          className="relative z-20 bg-[#f0eeea] px-[clamp(20px,5vw,72px)] py-16 text-[#20261a] sm:py-24"
          id="steps"
        >
          <div className="mx-auto w-full max-w-7xl lg:px-12 lg:py-16">
            <div className="mx-auto max-w-[680px] text-center">
              <h2 className="text-[clamp(2.3rem,5vw,3.6rem)] font-bold leading-[0.98] tracking-[-0.04em]">
                Three simple steps.
              </h2>
            </div>

            <div className="relative mt-12 grid border-[#d6d6c8]/60 md:grid-cols-3 md:border-t">
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 hidden h-3 bg-[repeating-linear-gradient(to_right,rgba(32,38,26,0.08)_0,rgba(32,38,26,0.08)_1px,transparent_1px,transparent_8px)] md:block"
                aria-hidden="true"
              />

              {/* Step 1 */}
              <article className="group/card relative flex min-h-[400px] flex-col border-[#d6d6c8]/60 py-7 transition-colors duration-300 hover:bg-[#f0eeea]/35 max-md:border-t md:px-6 md:[&:not(:first-child)]:border-l lg:px-8">
                <span className="mb-10 inline-flex h-9 w-fit items-center justify-center rounded-md border border-[#d6d6c8]/70 bg-[#f0eeea] px-4 text-sm font-bold text-[#20261a]/80 group-hover/card:border-[#4c5d34]/30 group-hover/card:text-[#333e22]">
                  Step 01
                </span>
                <h3 className="max-w-[14ch] text-xl font-bold leading-[1.1] tracking-[-0.02em]">
                  {t('landing.step1Title')}
                </h3>
                <p className="mt-4 max-w-[28ch] text-[0.95rem] font-medium leading-[1.5] text-[#6b6e5d]">
                  {t('landing.step1Body')}
                </p>
                {/* Step Sketch 1 */}
                <div className="relative mt-auto h-[172px] overflow-hidden rounded-md bg-[#eeeee4]/75 group-hover/card:bg-[#f0eeea]/80 transition-colors">
                  <svg className="absolute left-1/2 top-1/2 h-[178px] w-[235px] -translate-x-1/2 -translate-y-1/2 overflow-visible text-[#4c5d34] transition-transform duration-500 ease-out group-hover/card:scale-105" viewBox="0 0 250 190" fill="none">
                    <g className="opacity-95" vectorEffect="non-scaling-stroke">
                      <path d="M38 130C74 93 112 78 151 86C181 92 202 111 218 139" className="stroke-[#9c7420]/65" strokeDasharray="6 9" strokeWidth="1.7" />
                      <rect x="70" y="34" width="108" height="126" rx="14" className="stroke-[#4c5d34]" strokeWidth="2" transform="rotate(-6 124 97)" />
                      <path d="M94 69L151 63M92 91L160 84M91 113L139 108" className="stroke-[#4c5d34]/60" strokeWidth="1.7" transform="rotate(-6 124 97)" />
                      <g className="stroke-[#9c7420]" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4">
                        <path d="M82 134L68 148C59 157 44 157 35 148C26 139 26 124 35 115L48 102" />
                        <path d="M68 120L105 83" />
                      </g>
                    </g>
                  </svg>
                </div>
              </article>

              {/* Step 2 */}
              <article className="group/card relative flex min-h-[400px] flex-col border-[#d6d6c8]/60 py-7 transition-colors duration-300 hover:bg-[#f0eeea]/35 max-md:border-t md:px-6 md:[&:not(:first-child)]:border-l lg:px-8">
                <span className="mb-10 inline-flex h-9 w-fit items-center justify-center rounded-md border border-[#d6d6c8]/70 bg-[#f0eeea] px-4 text-sm font-bold text-[#20261a]/80 group-hover/card:border-[#4c5d34]/30 group-hover/card:text-[#333e22]">
                  Step 02
                </span>
                <h3 className="max-w-[14ch] text-xl font-bold leading-[1.1] tracking-[-0.02em]">
                  {t('landing.step2Title')}
                </h3>
                <p className="mt-4 max-w-[28ch] text-[0.95rem] font-medium leading-[1.5] text-[#6b6e5d]">
                  {t('landing.step2Body')}
                </p>
                {/* Step Sketch 2 */}
                <div className="relative mt-auto h-[172px] overflow-hidden rounded-md bg-[#eeeee4]/75 group-hover/card:bg-[#f0eeea]/80 transition-colors">
                  <svg className="absolute left-1/2 top-1/2 h-[178px] w-[235px] -translate-x-1/2 -translate-y-1/2 overflow-visible text-[#4c5d34] transition-transform duration-500 ease-out group-hover/card:scale-105" viewBox="0 0 250 190" fill="none">
                    <g className="opacity-95" vectorEffect="non-scaling-stroke">
                      <path d="M34 104C68 75 103 62 139 66C172 70 198 88 220 119" className="stroke-[#4c5d34]/35" strokeDasharray="5 10" strokeWidth="1.6" />
                      <path d="M39 139H211" className="stroke-[#4c5d34]/45" strokeLinecap="round" strokeWidth="1.7" />
                      <g className="stroke-[#4c5d34]" strokeWidth="2">
                        <rect x="47" y="112" width="36" height="27" rx="7" />
                        <rect x="167" y="112" width="36" height="27" rx="7" />
                      </g>
                      <path d="M83 125H107M143 125H167" className="stroke-[#9c7420]/75" strokeDasharray="4 7" strokeLinecap="round" strokeWidth="2" />
                    </g>
                  </svg>
                </div>
              </article>

              {/* Step 3 */}
              <article className="group/card relative flex min-h-[400px] flex-col border-[#d6d6c8]/60 py-7 transition-colors duration-300 hover:bg-[#f0eeea]/35 max-md:border-t md:px-6 md:[&:not(:first-child)]:border-l lg:px-8">
                <span className="mb-10 inline-flex h-9 w-fit items-center justify-center rounded-md border border-[#d6d6c8]/70 bg-[#f0eeea] px-4 text-sm font-bold text-[#20261a]/80 group-hover/card:border-[#4c5d34]/30 group-hover/card:text-[#333e22]">
                  Step 03
                </span>
                <h3 className="max-w-[14ch] text-xl font-bold leading-[1.1] tracking-[-0.02em]">
                  {t('landing.step3Title')}
                </h3>
                <p className="mt-4 max-w-[28ch] text-[0.95rem] font-medium leading-[1.5] text-[#6b6e5d]">
                  {t('landing.step3Body')}
                </p>
                {/* Step Sketch 3 */}
                <div className="relative mt-auto h-[172px] overflow-hidden rounded-md bg-[#eeeee4]/75 group-hover/card:bg-[#f0eeea]/80 transition-colors">
                  <svg className="absolute left-1/2 top-1/2 h-[178px] w-[235px] -translate-x-1/2 -translate-y-1/2 overflow-visible text-[#4c5d34] transition-transform duration-500 ease-out group-hover/card:scale-105" viewBox="0 0 250 190" fill="none">
                    <g className="opacity-95" vectorEffect="non-scaling-stroke">
                      <rect x="65" y="37" width="120" height="126" rx="15" className="stroke-[#4c5d34]" strokeWidth="2" transform="rotate(5 125 100)" />
                      <path d="M89 72L151 78M87 95L163 102M86 119L136 124" className="stroke-[#4c5d34]/50" strokeWidth="1.7" transform="rotate(5 125 100)" />
                      <path d="M157 121V105C157 87 169 76 185 76C201 76 213 87 213 105V121" className="stroke-[#9c7420]" strokeWidth="2.4" />
                    </g>
                  </svg>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR DEMOGRAPHICS CARDS */}
        <section className="relative z-20 bg-[#f0eeea] px-[clamp(20px,5vw,72px)] py-16 text-[#20261a] sm:py-24" id="users">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="text-balance text-[clamp(2.45rem,5.2vw,3.6rem)] font-bold leading-[0.96] tracking-[-0.04em] mb-12">
              Designed for private internet earnings.
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
              <article className="group relative min-h-[360px] overflow-hidden rounded-xl bg-[#20261a] text-[#f5f3ea] md:min-h-[390px] lg:min-h-[430px]">
                <img src="/assets/freelancer.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity" />
                <div className="absolute inset-0 bg-[#20261a]/30 mix-blend-multiply" aria-hidden="true" />
                <div className="relative flex h-full flex-col justify-between p-7 lg:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f5f3ea]/75">Private Invoices</p>
                  <div>
                    <h3 className="text-3xl font-bold leading-[1] tracking-[-0.02em]">Freelancers</h3>
                    <p className="mt-3 max-w-[28ch] text-[#f5f3ea]/80">Save splits and routes international client payments into yield anonymously.</p>
                  </div>
                </div>
              </article>

              <article className="group relative min-h-[360px] overflow-hidden rounded-xl bg-[#20261a] text-[#f5f3ea] md:min-h-[390px] lg:min-h-[430px]">
                <img src="/assets/agency.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity" />
                <div className="absolute inset-0 bg-[#20261a]/30 mix-blend-multiply" aria-hidden="true" />
                <div className="relative flex h-full flex-col justify-between p-7 lg:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f5f3ea]/75">Business Revenue</p>
                  <div>
                    <h3 className="text-3xl font-bold leading-[1] tracking-[-0.02em]">Agencies</h3>
                    <p className="mt-3 max-w-[28ch] text-[#f5f3ea]/80">Manage merchant billing splits privately without leaking business cashflows.</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* PROTOCOLS YIELD MAP */}
        <section className="relative z-20 bg-[#f0eeea] px-[clamp(20px,5vw,72px)] py-16 text-[#20261a] sm:py-24" id="protocols">
          <div className="mx-auto w-full max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {t('landing.protocolsTitle')}
            </h2>
            <p className="mt-3 text-muted-foreground">{t('landing.protocolsCaption')}</p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <a
                href="https://docs.iex.ec/nox-protocol/getting-started/welcome"
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center gap-4 rounded-2xl border border-[#d6d6c8] bg-card p-6 text-center outline-none transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-[#eeeee4]">
                  <img src="/logos/nox-vault-icon.svg" className="h-[60%] w-[60%] object-contain" alt="" />
                </span>
                <div>
                  <p className="font-bold text-lg">Nox Vault</p>
                  <p className="mt-1 text-sm text-muted-foreground">Confidential yield pool</p>
                </div>
              </a>

              <a
                href="https://aave.com"
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center gap-4 rounded-2xl border border-[#d6d6c8] bg-card p-6 text-center outline-none transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-[#eeeee4]">
                  <img src="/logos/aave-icon.svg" className="h-[60%] w-[60%] object-contain" alt="" />
                </span>
                <div>
                  <p className="font-bold text-lg">Aave V3</p>
                  <p className="mt-1 text-sm text-muted-foreground">USDC lending pool</p>
                </div>
              </a>

              <a
                href="https://uniswap.org"
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center gap-4 rounded-2xl border border-[#d6d6c8] bg-card p-6 text-center outline-none transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-[#eeeee4]">
                  <img src="/logos/uniswap-icon.svg" className="h-[60%] w-[60%] object-contain" alt="" />
                </span>
                <div>
                  <p className="font-bold text-lg">Uniswap V2</p>
                  <p className="mt-1 text-sm text-muted-foreground">USDC liquidity pool</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* BOTTOM FINAL CTA SECTION */}
        <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-[#1d2215] px-6 py-24 text-[#f5f3ea]">
          <div className="relative mx-auto w-full max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              {t('landing.finalCtaTitle')}
            </h2>
            <p className="mt-4 text-[#f5f3ea]/70 text-lg max-w-xl mx-auto">{t('landing.finalCtaBody')}</p>
            <Button asChild size="lg" className="mt-8 bg-[#f5f3ea] text-[#1d2215] hover:bg-white border-none font-bold rounded-lg px-8">
              <Link to="/app">{t('landing.cta')}</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#d6d6c8]/20 bg-[#1d2215] text-[#f5f3ea]/70 py-12 px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <LogoMark size={24} className="text-[#f5f3ea]" />
            <span className="text-lg font-bold text-[#f5f3ea]">Save</span>
          </div>
          <p className="text-xs text-[#f5f3ea]/50">{t('landing.footer')}</p>
          <a
            href="#top"
            className="text-xs font-semibold text-[#f5f3ea] hover:underline"
          >
            {t('landing.backToTop')}
          </a>
        </div>
      </footer>
    </div>
  )
}
