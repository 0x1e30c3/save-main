import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Lenis from 'lenis'
import { useT } from '@/lib/i18n'
import { ScrollReveal } from '@/components/brand/scroll-reveal'
import { LogoMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

function SectionLabel({ number, children }: { number: string; children: string }) {
  return (
    <p className="font-mono text-[10px] font-bold tracking-[0.23em] uppercase text-secondary">
      [{number}] {children}
    </p>
  )
}

export function Landing() {
  const t = useT()
  const [selectedFeature, setSelectedFeature] = useState(0)

  useEffect(() => {
    const lenis = new Lenis()
    function raf(time: number) {
      lenis.raf(time * 1000)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <div className="relative min-h-svh bg-[#eee8d8] text-[#193d2d] font-sans selection:bg-[#b7d6bd] selection:text-[#173d2d]">
      {/* Header / Top Navigation — kept simple per user request */}
      <header className="fixed inset-x-0 top-0 z-[70] flex items-center justify-between px-6 py-4 md:px-12 border-b border-transparent data-[scrolled=true]:border-[#c9bfa5]/40 data-[scrolled=true]:bg-[#eee8d8]/85 data-[scrolled=true]:backdrop-blur-md transition-all">
        <Link className="flex items-center gap-2.5 outline-none" to="/">
          <LogoMark size={28} className="text-[#193d2d]" />
          <span className="text-xl font-bold tracking-tight text-[#193d2d]">Save</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden items-center gap-6 text-sm font-semibold tracking-[0.02em] text-[#526457] sm:flex">
            <a href="#about" className="hover:text-[#193d2d] transition-colors">{t('landing.navCompare')}</a>
            <a href="#features" className="hover:text-[#193d2d] transition-colors">{t('landing.navHow')}</a>
            <a href="#protocols" className="hover:text-[#193d2d] transition-colors">{t('landing.navProtocols')}</a>
          </nav>
          <Button asChild size="sm" className="bg-[#1c4934] text-[#f2ecda] hover:bg-[#2a5c44] border-none font-semibold rounded-lg px-5">
            <Link to="/app">{t('landing.cta')}</Link>
          </Button>
        </div>
      </header>

      <main id="main-content" className="relative z-10 overflow-x-clip">

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: HERO (kept as-is per user request)
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative isolate z-20 grid min-h-svh place-items-center overflow-hidden px-5 pb-8 pt-24 sm:px-8 sm:pb-10 sm:pt-28" id="top">
          <img className="absolute inset-0 z-[-3] h-full w-full object-cover opacity-40 mix-blend-luminosity" src="/assets/section1-bg.jpg" alt="" />
          <div className="pointer-events-none absolute inset-0 z-[-2] bg-[radial-gradient(48%_56%_at_50%_47%,rgba(9,13,22,0.6),rgba(9,13,22,0.1)_76%),linear-gradient(to_bottom,rgba(29,34,21,0.6),transparent_22%,transparent_60%,rgba(9,13,22,0.7))]" aria-hidden="true" />

          <div className="pointer-events-none absolute inset-0 z-[-1]" aria-hidden="true">
            <div className="absolute left-0 top-1/2 origin-left -translate-y-[46%] max-lg:-translate-y-[58%] max-lg:scale-90 max-[620px]:opacity-40">
              <img className="block h-auto w-[min(46vw,600px)] [filter:drop-shadow(0_26px_40px_rgba(0,0,0,0.55))] max-lg:w-[62vw] max-[620px]:w-[76vw]" src="/assets/left-hand.png" alt="" />
            </div>
            <div className="absolute right-0 top-1/2 origin-right -translate-y-[40%] max-lg:-translate-y-[16%] max-lg:scale-90 max-[620px]:opacity-40">
              <img className="block h-auto w-[min(46vw,600px)] [filter:drop-shadow(0_26px_40px_rgba(0,0,0,0.55))] max-lg:w-[62vw] max-[620px]:w-[76vw]" src="/assets/right-hand.png" alt="" />
            </div>
          </div>

          <div className="relative flex min-h-[clamp(500px,72svh,640px)] w-full max-w-[480px] bg-[radial-gradient(115%_90%_at_50%_45%,rgba(29,34,21,0.7),rgba(9,13,22,0.2)_100%)] px-6 py-7 text-[#f8fafc] [text-shadow:0_1px_18px_rgba(0,0,0,0.6)] sm:px-9 sm:py-9 lg:px-10 lg:py-11">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 340 452" preserveAspectRatio="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="339" height="451" pathLength={1} strokeDasharray={1} className="fill-none stroke-[#f8fafc]/40" />
            </svg>
            <div className="relative flex w-full flex-col">
              <h1 className="m-0 mt-2 flex flex-col text-[clamp(2.1rem,8vw,3.6rem)] font-bold leading-[0.98] tracking-[-0.03em] text-[#f8fafc] sm:mt-4 sm:text-[clamp(2.1rem,4.4vw,3.6rem)]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                <span>Confidential</span>
                <span>FXRP</span>
                <span>Savings</span>
              </h1>
              <p className="mt-6 max-w-[28ch] text-sm font-semibold uppercase leading-[1.55] tracking-[0.08em] text-[#f8fafc]/70" style={{ fontFamily: "'Space Mono', monospace" }}>
                {t('landing.heroTitle')}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7">
                <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#f5f3ea] px-3 text-center text-sm font-bold tracking-[0.02em] text-[#090d16] transition-opacity hover:opacity-85 sm:px-5" to="/app">
                  {t('landing.cta')}
                </Link>
                <a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#f8fafc]/50 bg-transparent px-3 text-center text-sm font-bold leading-tight tracking-[0.02em] text-[#f8fafc] transition-opacity hover:opacity-85 sm:px-5" href="#about">
                  {t('landing.navCompare')}
                </a>
              </div>
              <ul className="mt-auto grid list-none gap-0.5 pt-5 sm:pt-6">
                <li>
                  <a href="#about" className="flex items-baseline justify-between border-b border-transparent py-2 text-[15px] font-bold text-[#f8fafc]/60 hover:text-white sm:py-2.5">
                    <span>{t('landing.navCompare')}</span>
                    <span className="text-xs font-semibold text-[#f8fafc]/40" style={{ fontFamily: "'Space Mono', monospace" }}>I</span>
                  </a>
                </li>
                <li>
                  <a href="#features" className="flex items-baseline justify-between border-b border-transparent py-2 text-[15px] font-bold text-[#f8fafc]/60 hover:text-white sm:py-2.5">
                    <span>{t('landing.navHow')}</span>
                    <span className="text-xs font-semibold text-[#f8fafc]/40" style={{ fontFamily: "'Space Mono', monospace" }}>II</span>
                  </a>
                </li>
                <li>
                  <a href="#protocols" className="flex items-baseline justify-between border-b border-transparent py-2 text-[15px] font-bold text-[#f8fafc]/60 hover:text-white sm:py-2.5">
                    <span>{t('landing.navProtocols')}</span>
                    <span className="text-xs font-semibold text-[#f8fafc]/40" style={{ fontFamily: "'Space Mono', monospace" }}>III</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2: ABOUT — Editorial 2-column
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-20 paper-grain bg-[#eee8d8] px-[clamp(20px,5vw,72px)] min-h-svh flex items-center" id="about">
          <div className="mx-auto grid w-full max-w-6xl items-start gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            {/* Left column: headline */}
            <div>
              <ScrollReveal
                containerClassName="max-w-lg"
                textClassName="text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[0.84] tracking-[-0.045em] text-[#193d2d]"
                baseRotation={0}
                blurStrength={3}
              >
                {t('landing.aboutTitle')}
              </ScrollReveal>
            </div>

            {/* Right column: body + stats */}
            <div className="lg:mt-8">
              <ScrollReveal textClassName="text-[clamp(1.05rem,1.55vw,1.2rem)] font-medium leading-[1.6] text-[#526457]" baseRotation={0} blurStrength={2}>
                {t('landing.aboutBody')}
              </ScrollReveal>

              <div className="mt-12 grid grid-cols-1 gap-0 sm:grid-cols-2">
                <div className="border-t border-[#c9bfa5] py-6 sm:border-r sm:pr-6">
                  <p className="font-mono text-[10px] font-bold tracking-[0.23em] uppercase text-secondary">{t('landing.aboutStat1Label')}</p>
                  <p className="mt-3 text-sm font-medium leading-[1.6] text-[#526457]">{t('landing.aboutStat1Body')}</p>
                </div>
                <div className="border-t border-[#c9bfa5] py-6 sm:pl-6">
                  <p className="font-mono text-[10px] font-bold tracking-[0.23em] uppercase text-secondary">{t('landing.aboutStat2Label')}</p>
                  <p className="mt-3 text-sm font-medium leading-[1.6] text-[#526457]">{t('landing.aboutStat2Body')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3: FEATURES — Interactive 3-card selection
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-20 paper-grain bg-[#c0d7bf] px-[clamp(20px,5vw,72px)] min-h-svh flex items-center" id="features">
          <div className="mx-auto w-full max-w-6xl">
            <SectionLabel number="02">{t('landing.featureLabel')}</SectionLabel>
            <h2
              className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[0.9] tracking-[-0.04em] text-[#193d2d]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('landing.featureTitle')}
            </h2>

            {/* Feature Cards */}
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {[
                { title: t('landing.feature1Title'), body: t('landing.feature1Body'), icon: '↔' },
                { title: t('landing.feature2Title'), body: t('landing.feature2Body'), icon: '↗' },
                { title: t('landing.feature3Title'), body: t('landing.feature3Body'), icon: '🔗' },
              ].map((feat, i) => (
                <button
                  key={feat.title}
                  type="button"
                  onClick={() => setSelectedFeature(i)}
                  className={`group relative flex flex-col items-start border-2 p-7 text-left transition-all duration-260 hover:-translate-y-[5px] ${
                    selectedFeature === i
                      ? 'border-[#1c4934] bg-[#f4ede0] shadow-lg'
                      : 'border-[#739d7b]/40 bg-[#d2e1ce]/60 hover:border-[#739d7b] hover:bg-[#d2e1ce]'
                  }`}
                  aria-pressed={selectedFeature === i}
                >
                  <span className={`mb-4 flex size-12 items-center justify-center text-2xl transition-transform duration-260 group-hover:rotate-12 ${
                    selectedFeature === i ? 'bg-[#1c4934] text-[#f2ecda]' : 'bg-[#b7d6bd] text-[#1c4934]'
                  }`}>
                    {feat.icon}
                  </span>
                  <h3
                    className="text-xl font-bold leading-[1.1] tracking-[-0.02em] text-[#193d2d]"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {feat.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-[1.6] text-[#526457]">{feat.body}</p>
                  <span className="mt-auto pt-4 text-xs font-bold text-[#1c4934] opacity-0 transition-opacity duration-260 group-hover:opacity-100">
                    Pilih ini →
                  </span>
                </button>
              ))}
            </div>

            {/* Feature Detail */}
            <div className="mt-12 grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-[0.23em] uppercase text-secondary">
                  [{String(selectedFeature + 1).padStart(2, '0')}]
                </p>
                <h3
                  className="mt-2 text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[#193d2d]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {[t('landing.feature1Title'), t('landing.feature2Title'), t('landing.feature3Title')][selectedFeature]}
                </h3>
                <p className="mt-4 text-[clamp(1rem,1.4vw,1.15rem)] font-medium leading-[1.6] text-[#526457]">
                  {[t('landing.feature1Body'), t('landing.feature2Body'), t('landing.feature3Body')][selectedFeature]}
                </p>
              </div>

              {/* Quote Card */}
              <div className="relative bg-[#1c4b36] p-8 sm:p-10">
                <div className="absolute -top-3 -left-3 size-16 rounded-full border-2 border-[#d5aa61]/40" aria-hidden="true" />
                <p
                  className="relative text-[clamp(1.2rem,2.2vw,1.8rem)] font-medium italic leading-[1.3] text-[#d5aa61]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  "{t('landing.quoteText')}"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 4: HOW IT WORKS — Dark green 3-step
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-20 paper-grain bg-[#173f2d] px-[clamp(20px,5vw,72px)] min-h-svh flex items-center" id="how">
          <div className="mx-auto w-full max-w-6xl">
            <SectionLabel number="03">{t('landing.howLabel')}</SectionLabel>
            <h2
              className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[0.9] tracking-[-0.04em] text-[#f2ecda]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('landing.howWorkTitle')}
            </h2>

            <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
              {/* Vertical dividers on desktop */}
              <div className="absolute top-0 bottom-0 left-[33%] hidden w-px bg-[#789b7e]/30 sm:block" aria-hidden="true" />
              <div className="absolute top-0 bottom-0 right-[33%] hidden w-px bg-[#789b7e]/30 sm:block" aria-hidden="true" />

              {[
                { num: '01', title: t('landing.step1Title'), body: t('landing.step1Body') },
                { num: '02', title: t('landing.step2Title'), body: t('landing.step2Body') },
                { num: '03', title: t('landing.step3Title'), body: t('landing.step3Body') },
              ].map((step) => (
                <div key={step.num} className="relative flex flex-col">
                  <p className="font-mono text-[10px] font-bold tracking-[0.23em] uppercase text-[#b7d6bd]">
                    {step.num}
                  </p>
                  <h3
                    className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1] tracking-[-0.03em] text-[#f2ecda]"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm font-medium leading-[1.6] text-[#b7d6bd]">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 5: ARCHITECTURE — Gold accent with diagram
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-20 paper-grain overflow-hidden bg-[#eee8d8] px-[clamp(20px,5vw,72px)] min-h-svh flex items-center" id="protocols">
          {/* Line-art grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.11]"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(90deg, rgba(28,73,52,1) 1px, transparent 1px), linear-gradient(180deg, rgba(28,73,52,1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="relative mx-auto grid w-full max-w-6xl items-start gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
            {/* Left: Text */}
            <div>
              <SectionLabel number="04">{t('landing.archLabel')}</SectionLabel>
              <h2
                className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[0.9] tracking-[-0.04em] text-[#193d2d]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {t('landing.archTitle')}
              </h2>
              <p className="mt-6 text-[clamp(1rem,1.4vw,1.15rem)] font-medium leading-[1.6] text-[#4c5d4a]">
                {t('landing.archBody')}
              </p>

              {/* Protocol logos */}
              <div className="mt-10 flex flex-wrap gap-4">
                {[
                  { name: 'SparkDEX', logo: '/logos/sparkdex-icon.svg', href: 'https://sparkdex.finance' },
                  { name: 'Firelight', logo: '/logos/firelight-icon.svg', href: 'https://firelight.finance' },
                  { name: 'Upshift', logo: '/logos/upshift-icon.svg', href: 'https://upshift.finance' },
                ].map((p) => (
                  <a
                    key={p.name}
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2 rounded-full border border-[#4c5d4a]/30 bg-[#f4ede0]/60 px-4 py-2 text-sm font-semibold text-[#193d2d] transition-all hover:bg-[#f4ede0] hover:shadow-md"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e4c17b]/40">
                      <img src={p.logo} alt="" className="h-full w-full object-contain p-0.5" />
                    </span>
                    {p.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Right: Process diagram */}
            <div className="relative bg-[#e4c17b]/50 p-8 sm:p-10 border border-[#4c5d4a]/20">
              <div className="flex flex-col gap-6">
                {[
                  { step: '01', label: t('landing.archStep1'), body: t('landing.archStep1Body') },
                  { step: '02', label: t('landing.archStep2'), body: t('landing.archStep2Body') },
                  { step: '03', label: t('landing.archStep3'), body: t('landing.archStep3Body') },
                ].map((s, i) => (
                  <div key={s.step}>
                    <div className="flex items-start gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#1c4934]/30 font-mono text-xs font-bold text-[#1c4934]">
                        {s.step}
                      </span>
                      <div>
                        <p className="font-bold text-[#193d2d]">{s.label}</p>
                        <p className="mt-1 text-sm text-[#4c5d4a]">{s.body}</p>
                      </div>
                    </div>
                    {i < 2 && (
                      <div className="ml-5 mt-3 mb-1 w-px h-6 border-l-2 border-dashed border-[#1c4934]/20" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 6: FINAL CTA — Dark with serif headline
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-20 min-h-svh flex items-center overflow-hidden px-[clamp(20px,5vw,72px)]">
          <img className="absolute inset-0 z-[-3] h-full w-full object-cover opacity-40 mix-blend-luminosity" src="/assets/section1-bg.jpg" alt="" />
          <div className="pointer-events-none absolute inset-0 z-[-2] bg-[radial-gradient(48%_56%_at_50%_47%,rgba(9,13,22,0.6),rgba(9,13,22,0.1)_76%),linear-gradient(to_bottom,rgba(29,34,21,0.6),transparent_22%,transparent_60%,rgba(9,13,22,0.7))]" aria-hidden="true" />
          <div className="relative mx-auto w-full max-w-3xl text-center">
            <h2
              className="text-[clamp(2.4rem,5.5vw,4.8rem)] font-bold leading-[0.88] tracking-[-0.05em] text-[#f2ecda]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('landing.footerCtaTitle')}
            </h2>
            <p className="mt-6 text-lg text-[#b7d6bd] max-w-lg mx-auto">
              {t('landing.footerCtaBody')}
            </p>
            <Button asChild size="lg" className="mt-10 bg-[#d5aa61] text-[#193d2d] hover:bg-[#e4c17b] border-none font-bold rounded-lg px-10">
              <Link to="/app">{t('landing.cta')}</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER — Editorial style
      ═══════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-[#c9bfa5] bg-[#eee8d8] min-h-svh flex flex-col justify-center">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-14 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark size={22} />
              <span className="text-lg font-semibold tracking-tight text-[#193d2d]">Save</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-[#526457]">
              {t('landing.footerTagline')}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.23em] uppercase text-[#526457]">
              {t('landing.footerProduct')}
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { to: '/app', label: t('nav.dashboard') },
                { to: '/app/yield', label: t('nav.yield') },
                { to: '/app/activity', label: t('nav.activity') },
                { to: '/app/link', label: t('nav.paymentLink') },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-[#526457] hover:text-[#193d2d] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.23em] uppercase text-[#526457]">
              {t('landing.footerProtocols')}
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { href: 'https://sparkdex.finance', logo: '/logos/sparkdex-icon.svg', name: 'SparkDEX' },
                { href: 'https://firelight.finance', logo: '/logos/firelight-icon.svg', name: 'Firelight' },
                { href: 'https://upshift.finance', logo: '/logos/upshift-icon.svg', name: 'Upshift' },
              ].map((p) => (
                <li key={p.href}>
                  <a href={p.href} target="_blank" rel="noreferrer" className="group flex items-center gap-2 text-sm text-[#526457] hover:text-[#193d2d] transition-colors">
                    <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#c9bf9f]/50">
                      <img src={p.logo} alt="" className="h-full w-full object-contain p-0.5" />
                    </span>
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.23em] uppercase text-[#526457]">
              {t('landing.footerResources')}
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="https://dev.flare.network" target="_blank" rel="noreferrer" className="text-sm text-[#526457] hover:text-[#193d2d] transition-colors">
                  Flare Docs
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#c9bfa5]">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-[#526457]">
            <p>{t('landing.footer')}</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#c9bfa5] px-3 py-1.5 outline-none transition-colors hover:text-[#193d2d] hover:border-[#193d2d]"
            >
              {t('landing.backToTop')}
              ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
