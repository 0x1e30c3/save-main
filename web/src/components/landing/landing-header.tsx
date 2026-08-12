import { Link } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { LogoMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

export function LandingHeader() {
  const t = useT()
  return (
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
  )
}
