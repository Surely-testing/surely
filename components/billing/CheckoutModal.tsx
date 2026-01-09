// ============================================
// FILE: components/billing/CheckoutModal.tsx
// Embedded checkout modal component
// ============================================
'use client'

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  checkoutUrl: string
  onSuccess?: () => void
}

export function CheckoutModal({ isOpen, onClose, checkoutUrl, onSuccess }: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    // Dynamically load the DodoPayments checkout SDK
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/dodopayments-checkout@latest/dist/index.js'
    script.async = true
    
    script.onload = () => {
      // @ts-ignore
      const { DodoPayments } = window

      DodoPayments.Initialize({
        mode: process.env.NEXT_PUBLIC_DODO_MODE || 'test',
        displayType: 'overlay',
        onEvent: (event: any) => {
          console.log('Checkout event:', event)

          if (event.event_type === 'checkout.opened') {
            setIsLoading(false)
          }

          if (event.event_type === 'checkout.status') {
            const status = event.data?.message?.status
            if (status === 'succeeded') {
              onSuccess?.()
              onClose()
            }
          }

          if (event.event_type === 'checkout.closed') {
            onClose()
          }
        }
      })

      // Open checkout
      DodoPayments.Checkout.open({
        checkoutUrl,
        options: {
          showTimer: true,
          showSecurityBadge: true,
          manualRedirect: false
        }
      })
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
      // @ts-ignore
      if (window.DodoPayments?.Checkout?.close) {
        // @ts-ignore
        window.DodoPayments.Checkout.close()
      }
    }
  }, [isOpen, checkoutUrl, onSuccess, onClose])

  if (!isOpen) return null

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
      )}
    </>
  )
}