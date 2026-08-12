import { WalletIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useT } from '@/lib/i18n'

interface WalletPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalletPicker({ open, onOpenChange }: WalletPickerProps) {
  const t = useT()
  const { connectors, connect, isPending } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (isConnected) {
      onOpenChange(false)
    }
  }, [isConnected, onOpenChange])

  const handleSelect = (connector: (typeof connectors)[number]) => {
    connect({ connector })
    onOpenChange(false)
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
            {connectors.length === 0 ? (
              <div className="rounded-xl border p-4 text-center">
                <p className="text-sm text-muted-foreground">{t('wallet.none')}</p>
              </div>
            ) : (
              connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  variant="outline"
                  className="h-auto justify-start gap-3 px-4 py-3"
                  onClick={() => handleSelect(connector)}
                  disabled={isPending}
                >
                  {connector.icon ? (
                    <img src={connector.icon} alt="" className="size-7 rounded-full" />
                  ) : (
                    <WalletIcon className="size-7" />
                  )}
                  <span className="font-semibold">
                    {connector.id === 'injected' ? t('wallet.injected') : connector.name}
                  </span>
                </Button>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
