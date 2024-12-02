import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cn } from '../../lib/utils'

interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

const ToastProvider = ToastPrimitives.Provider
const ToastViewport = ToastPrimitives.Viewport

const ToastComponent = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ title, description, variant = 'default', ...props }, ref) => {
    return (
      <ToastProvider>
        <ToastPrimitives.Root
          ref={ref}
          className={cn(
            'fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg',
            variant === 'success' && 'bg-green-100 text-green-900',
            variant === 'destructive' && 'bg-red-100 text-red-900',
            variant === 'default' && 'bg-white text-gray-900'
          )}
          {...props}
        >
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="mt-1 text-sm">{description}</div>}
        </ToastPrimitives.Root>
        <ToastViewport />
      </ToastProvider>
    )
  }
)

ToastComponent.displayName = 'Toast'

export const showToast = (props: ToastProps) => {
  const toastContainer = document.createElement('div')
  document.body.appendChild(toastContainer)

  const root = ReactDOM.createRoot(toastContainer)
  root.render(<ToastComponent {...props} />)

  setTimeout(() => {
    root.unmount()
    document.body.removeChild(toastContainer)
  }, 3000)
} 