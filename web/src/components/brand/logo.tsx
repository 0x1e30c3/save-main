import { cn } from '@/lib/utils'

/**
 * Brand mark: Renders the new YourSave logo image.
 */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-yoursave.png"
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      alt="YourSave Logo"
    />
  )
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={22} />
      <span className="text-lg font-semibold tracking-tight">YourSave</span>
    </span>
  )
}
