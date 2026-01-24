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
    const [mode, setMode] = useState<'curp' | 'identity' | 'bio'>('curp')
    const [query, setQuery] = useState("")
    
    // Bio state
    const [dob, setDob] = useState("")
    const [degree, setDegree] = useState("Doctorado")


    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [user, setUser] = useState<any>(null)
    const [copied, setCopied] = useState(false)

    // Reset state when opening/closing or switching modes
    const handleClose = () => {
        resetState()
        onClose()
    }

    const resetState = () => {
        setQuery("")
        setDob("")
        setDegree("Doctorado")

        setError("")
        setUser(null)
        setMode('curp')
    }

    // Import actions dynamically or just use what we have. 
    // Ideally we import them at top. Added imports below implicitly if not present, 
    // but this tool replaces content inside the function mostly, I should ensure imports are present.
    // I can't easily add imports with this tool if I only replace the function.
    // So I will replace the whole file content or ensure I use what's available.
    // The previous view showed: import { recoverAccountByCurp } from "@/app/actions"
    // I need to add recoverAccountByIdentityCode, recoverAccountByBio to imports. 
    // I will do a separate import update first, then this one. 
    // Actually, I can do it in two steps.
    
    // Logic handles
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setUser(null)

        try {
            let result;
            if (mode === 'curp') {
                if (!query.trim()) return
                // Dynamic import not needed if I update imports first. Assuming I will.
                const { recoverAccountByCurp } = await import("@/app/actions") 
                result = await recoverAccountByCurp(query)
            } else if (mode === 'identity') {
                if (!query.trim()) return
                 const { recoverAccountByIdentityCode } = await import("@/app/actions")
                result = await recoverAccountByIdentityCode(query)
            } else {
                if (!dob || !degree) {
                    setError("Todos los campos son requeridos.")
                    setLoading(false)
                    return
                }
                 const { recoverAccountByBio } = await import("@/app/actions")
                result = await recoverAccountByBio(dob, degree, "")
            }

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
                            <div className="text-center text-sm text-muted-foreground mb-4">
                                {mode === 'curp' && <p>Ingresa los primeros caracteres de tu CURP.</p>}
                                {mode === 'identity' && <p>Ingresa tu Código de Identidad Nacional.</p>}
                                {mode === 'bio' && <p>Ingresa tus datos personales exactos.</p>}
                            </div>
                            
                            <form onSubmit={handleSearch} className="space-y-4">
                                {mode === 'curp' && (
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
                                )}

                                {mode === 'identity' && (
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Código de Pasaporte / ID"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            className="text-center"
                                            minLength={3}
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {mode === 'bio' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500">Fecha de Nacimiento</label>
                                            <Input
                                                type="date"
                                                value={dob}
                                                onChange={(e) => setDob(e.target.value)}
                                                className="text-center"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500">Grado Académico</label>
                                            <select 
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={degree}
                                                onChange={(e) => setDegree(e.target.value)}
                                            >
                                                <option value="Doctorado">Doctorado</option>
                                                <option value="Maestría">Maestría</option>
                                                <option value="Licenciatura">Licenciatura</option>
                                                <option value="Estudiante">Estudiante</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center font-medium animate-in fade-in">
                                        {error}
                                    </div>
                                )}

                                <Button 
                                    type="submit" 
                                    className="w-full bg-brand-main hover:bg-brand-main/90" 
                                    disabled={loading || (mode !== 'bio' && query.length < 3)}
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Search className="h-4 w-4 mr-2" />
                                    )}
                                    Buscar Registro
                                </Button>
                            </form>
                            
                            {/* Navigation Buttons */}
                            <div className="pt-2 space-y-2">
                                {mode === 'curp' && (
                                    <Button 
                                        variant="ghost" 
                                        className="w-full text-xs text-muted-foreground" 
                                        onClick={() => { setMode('identity'); setQuery(""); setError(""); }}
                                    >
                                        No tengo CURP
                                    </Button>
                                )}
                                {mode === 'identity' && (
                                    <div className="space-y-1">
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-xs text-muted-foreground" 
                                            onClick={() => { setMode('bio'); setQuery(""); setError(""); }}
                                        >
                                            No tengo Código de Identidad
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-xs text-brand-main h-6" 
                                            onClick={() => { setMode('curp'); setQuery(""); setError(""); }}
                                        >
                                            Volver a búsqueda por CURP
                                        </Button>
                                    </div>
                                )}
                                {mode === 'bio' && (
                                    <Button 
                                        variant="ghost" 
                                        className="w-full text-xs text-brand-main" 
                                        onClick={() => { setMode('curp'); setQuery(""); setError(""); }}
                                    >
                                        Volver al inicio
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-brand-secondary/10 border border-brand-secondary/30 rounded-lg p-4 mb-6 text-center">
                                <p className="text-brand-secondary text-sm font-bold uppercase tracking-wider mb-1">¡Registro Encontrado!</p>
                                <h3 className="text-lg font-bold text-brand-darkest">{user.nombre} {user.apellido}</h3>
                                <p className="text-xs text-brand-main mt-1">{user.grado} • {user.short_id}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <Button onClick={handleLoginClick} className="w-full bg-brand-main hover:bg-brand-main/90 text-white shadow-md">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Iniciar Sesión Ahora
                                </Button>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" onClick={handleCopy} className="w-full hover:bg-brand-lightest hover:text-brand-darkest hover:border-brand-main/20">
                                        {copied ? <Check className="h-4 w-4 mr-2 text-brand-secondary" /> : <Copy className="h-4 w-4 mr-2" />}
                                        {copied ? "Copiado" : "Copiar ID"}
                                    </Button>
                                    <Button variant="outline" onClick={handlePrint} className="w-full hover:bg-brand-lightest hover:text-brand-darkest hover:border-brand-main/20">
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
