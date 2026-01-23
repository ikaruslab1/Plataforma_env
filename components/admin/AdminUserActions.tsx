"use client"

import { useState, useEffect } from "react"
import { Dialog } from "@/components/ui/Dialog"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/Button"
import { QrCodeIcon, Copy } from "lucide-react"

interface AdminUserActionsProps {
    shortId: string
    nombre: string
}

export function AdminUserActions({ shortId, nombre }: AdminUserActionsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [origin, setOrigin] = useState("")

    useEffect(() => {
        setOrigin(window.location.origin)
    }, [])

    const loginUrl = `${origin}/?id=${shortId}`

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(loginUrl)
    }

    return (
        <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-blue-600"
                onClick={() => setIsOpen(true)}
                title="Ver QR de Acceso"
            >
                <QrCodeIcon className="h-4 w-4" />
            </Button>

            <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Acceso Rápido">
                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    <div className="text-center space-y-1">
                        <p className="font-semibold text-lg"> {nombre}</p>
                        <p className="font-mono text-sm text-muted-foreground">{shortId}</p>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                        {origin && (
                            <QRCodeSVG 
                                value={loginUrl}
                                size={200}
                                level="M"
                            />
                        )}
                    </div>

                    <div className="text-center max-w-xs">
                        <p className="text-xs text-muted-foreground mb-4">
                            Pídele al usuario que escanee este código para ingresar directamente.
                        </p>
                        
                        <Button variant="outline" size="sm" onClick={handleCopyUrl} className="w-full gap-2">
                            <Copy className="h-3.5 w-3.5" />
                            Copiar Enlace Directo
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
