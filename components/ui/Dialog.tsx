"use client"
import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "./Button"
import { cn } from "@/lib/utils"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export const Dialog = ({ isOpen, onClose, children, title }: DialogProps) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className={cn(
        "relative w-full max-w-md bg-background rounded-lg border border-border p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
