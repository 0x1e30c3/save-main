import { WalletIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/lib/i18n'
import { discoverWallets, hasWindowEthereum, type WalletInfo } from '@/lib/wallet-discovery'

interface WalletPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (wallet: WalletInfo) => void
}

export function WalletPicker({ open, onOpenChange, onSelect }: WalletPickerProps) {
  const t = useT()
  const [wallets, setWallets] = useState<WalletInfo[] | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    console.log('[wallet-picker] open, ethereum exists:', hasWindowEthereum())
    setWallets(null)
    setBusy(false)
    let mounted = true
    discoverWallets(1000).then((found) => {
      console.log('[wallet-picker] discovered:', found)
      if (mounted) setWallets(found)
    })
    return () => {
      mounted = false
    }
  }, [open])

  const handleInjected = () => {
    console.log('[wallet-picker] using injected wallet')
    onSelect({
      uuid: 'injected',
      name: t('wallet.injected'),
      icon: '',
      rdns: 'injected',
      provider: (window as any).ethereum,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={"bottom" as any} className="rounded-t-2xl" aria-describedby={undefined}>
        <SheetTitle className="sr-only">{t('wallet.title')}</SheetTitle>
        <div className="mx-auto w-full max-w-sm pb-6 pt-2">
          <div className="mb-5 text-center">
            <h3 className="text-lg font-semibold">{t('wallet.title')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('wallet.caption')}</p>
          </div>

          <div className="grid gap-2">
            {wallets === null ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : wallets.length === 0 ? (
              <div className="rounded-xl border p-4 text-center">
                <p className="text-sm text-muted-foreground">{t('wallet.none')}</p>
                {hasWindowEthereum() && (
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={handleInjected}
                    disabled={busy}
                  >
                    <WalletIcon className="mr-2 size-4" />
                    {t('wallet.useInjected')}
                  </Button>
                )}
              </div>
            ) : (
              wallets.map((w) => (
                <Button
                  key={w.uuid}
                  variant="outline"
                  className="h-auto justify-start gap-3 px-4 py-3"
                  onClick={() => {
                    console.log('[wallet-picker] selected:', w.name)
                    setBusy(true)
                    onSelect(w)
                  }}
                  disabled={busy}
                >
                  {w.icon ? (
                    <img src={w.icon} alt="" className="size-7 rounded-full" />
                  ) : (
                    <WalletIcon className="size-7" />
                  )}
                  <span className="font-semibold">{w.name}</span>
                </Button>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
