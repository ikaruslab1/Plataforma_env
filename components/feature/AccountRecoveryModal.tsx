"use client"
import { useState } from "react"
import { Dialog } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { recoverAccountByCurp } from "@/app/actions"
import { Search, Loader2, Check, Copy, Printer, LogIn } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface AccountRecoveryModalProps {
    isOpen: boolean
    onClose: () => void
    onLogin: (shortId: string) => void
}

export function AccountRecoveryModal({ isOpen, onClose, onLogin }: AccountRecoveryModalProps) {
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [user, setUser] = useState<any>(null)
    const [copied, setCopied] = useState(false)

    // Reset state when opening/closing
    const handleClose = () => {
        setQuery("")
        setError("")
        setUser(null)
        onClose()
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setError("")
        setUser(null)

        try {
            const result = await recoverAccountByCurp(query)
            if (result.success) {
                setUser(result.user)
            } else {
                setError(result.message || "Error desconocido")
            }
        } catch (err) {
            setError("Ocurrió un error al buscar. Intenta de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        if (!user) return
        try {
            await navigator.clipboard.writeText(user.short_id)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy", err)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleLoginClick = () => {
        if (user) {
            onLogin(user.short_id)
            handleClose()
        }
    }

    return (
        <>
            <Dialog isOpen={isOpen} onClose={handleClose} title="Recuperar ID de Acceso">
                <div className="space-y-6 py-2">
                    {!user ? (
                        <>
                            <div className="text-center text-sm text-muted-foreground">
                                <p>Ingresa tu RFC o los primeros caracteres de tu CURP para buscar tu registro.</p>
                            </div>
                            
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Ej. ABCD900101..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="text-center uppercase tracking-widest"
                                        maxLength={18}
                                        autoFocus
                                    />
                                </div>
                                
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center font-medium animate-in fade-in">
                                        {error}
                                    </div>
                                )}

                                <Button 
                                    type="submit" 
                                    className="w-full" 
                                    disabled={loading || query.length < 4}
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Search className="h-4 w-4 mr-2" />
                                    )}
                                    Buscar Registro
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
                                <p className="text-green-800 text-sm font-medium mb-1">¡Registro Encontrado!</p>
                                <h3 className="text-lg font-bold text-gray-900">{user.nombre} {user.apellido}</h3>
                                <p className="text-xs text-green-700 mt-1">{user.grado} • {user.short_id}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <Button onClick={handleLoginClick} className="w-full bg-primary hover:bg-primary/90">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Iniciar Sesión Ahora
                                </Button>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" onClick={handleCopy} className="w-full">
                                        {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                                        {copied ? "Copiado" : "Copiar ID"}
                                    </Button>
                                    <Button variant="outline" onClick={handlePrint} className="w-full">
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            {/* Print Only View */}
            {user && (
                <div className="hidden print:flex print:fixed print:inset-0 print:bg-white print:z-[9999] print:items-center print:justify-center print:flex-col p-8">
                    <div className="border-4 border-black p-12 max-w-2xl w-full text-center space-y-8 rounded-xl">
                        <div className="space-y-4">
                            <p className="text-sm uppercase tracking-[0.3em] text-gray-500 font-bold">Ficha de Recuperación</p>
                            <h1 className="text-5xl font-bold text-black">{user.nombre} {user.apellido}</h1>
                            <p className="text-xl text-gray-600 font-medium uppercase tracking-wide">{user.grado}</p>
                        </div>
                        
                        <div className="py-8 border-y-4 border-black/10 my-8">
                           <div className="mb-4">
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Tu ID de Acceso</p>
                                <p className="text-6xl font-mono font-bold tracking-wider">{user.short_id}</p>
                           </div>
                        </div>

                        <div className="flex justify-center p-4">
                            <QRCodeSVG 
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?id=${user.short_id}`}
                                size={200}
                                level="H"
                            />
                        </div>

                         <div className="pt-8">
                            <p className="text-sm text-gray-400">Escanea este código para iniciar sesión automáticamente.</p>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                @media print {
                    body > *:not(.print\\:flex) {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    )
}
