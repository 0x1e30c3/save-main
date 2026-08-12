import { Link } from 'react-router-dom'
import { useT } from '@/lib/i18n'

export function LandingHero() {
  const t = useT()
  return (
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
            {[
              { label: t('landing.navCompare'), num: 'I', href: '#about' },
              { label: t('landing.navHow'), num: 'II', href: '#features' },
              { label: t('landing.navProtocols'), num: 'III', href: '#protocols' },
            ].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="flex items-baseline justify-between border-b border-transparent py-2 text-[15px] font-bold text-[#f8fafc]/60 hover:text-white sm:py-2.5">
                  <span>{item.label}</span>
                  <span className="text-xs font-semibold text-[#f8fafc]/40" style={{ fontFamily: "'Space Mono', monospace" }}>{item.num}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
