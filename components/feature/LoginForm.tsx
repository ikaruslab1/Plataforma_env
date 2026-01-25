"use client"
import { useFormStatus } from "react-dom"
import { verifyUser } from "@/app/actions"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { AccountRecoveryModal } from "./AccountRecoveryModal"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button className="w-full h-11 bg-brand-main hover:bg-brand-main/90 text-white transition-all shadow-md hover:shadow-lg" disabled={pending}>
            {pending ? "Verificando..." : "Ingresar"}
        </Button>
    )
}

export function LoginForm({ onRegisterClick }: { onRegisterClick: () => void }) {
    const [error, setError] = useState("")
    const [loginId, setLoginId] = useState("")
    const [showRecovery, setShowRecovery] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Rotating Text State
    const [greetingIndex, setGreetingIndex] = useState(0)
    const greetings = ["Bienvenido", "Bienvenida"]

    useEffect(() => {
        const interval = setInterval(() => {
            setGreetingIndex((prev) => (prev + 1) % greetings.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const [prefix, setPrefix] = useState("")
    const [suffix, setSuffix] = useState("")
    const suffixInputRef = useRef<HTMLInputElement>(null)

    // Initialize with URL param if present, but only once/if loginId is empty
    useState(() => {
        const paramId = searchParams.get('id')
        if (paramId) setLoginId(paramId)
    })

    // Sync external loginId changes (URL or Recovery) to inputs
    useEffect(() => {
        if (loginId) {
            const parts = loginId.split('-')
            if (parts.length >= 2) {
                setPrefix(parts[0])
                setSuffix(parts[1])
            } else {
                // Try simple split regex if clean
                const match = loginId.match(/^([A-Z]+)(\d+)$/);
                if (match) {
                    setPrefix(match[1]);
                    setSuffix(match[2]);
                } else {
                    setPrefix(loginId); // Fallback
                }
            }
        }
    }, [loginId])

    useEffect(() => {
        if (searchParams.get('recover') === 'true') {
            setShowRecovery(true)
        }
    }, [searchParams])

    // Load saved ID from localStorage on mount
    useEffect(() => {
        const savedId = localStorage.getItem('last_login_id')
        const paramId = searchParams.get('id')
        
        // If we have a saved ID and no ID from URL, use the saved one
        if (savedId && !paramId && !loginId) {
            setLoginId(savedId)
        }
    }, [])

    async function handleSubmit(formData: FormData) {
        setError("")
        const res = await verifyUser(formData)
        if (res?.error) {
            setError(res.error)
        } else if (res?.redirectUrl) {
           // Save ID to localStorage for next time
           const fullId = `${prefix}-${suffix}`
           localStorage.setItem('last_login_id', fullId)
           
           router.push(res.redirectUrl)
        }
    }

    const handleRecoveredId = (id: string) => {
        setLoginId(id)
        setShowRecovery(false)
    }

    return (
        <div className="w-full max-w-sm mx-auto p-8 animate-in fade-in zoom-in-95 duration-500 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl shadow-brand-darkest/5">
            <div className="text-center mb-10">
                <div className="flex justify-center mb-6">
                    <img src="/ium-negro.svg" alt="Logo UIM-II" className="h-16 w-auto drop-shadow-sm" />
                </div>
                <div className="h-10 mb-2 relative overflow-hidden flex justify-center items-center">
                    <AnimatePresence mode="wait">
                        <motion.h1
                            key={greetings[greetingIndex]}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="text-3xl font-bold tracking-tight absolute inset-x-0 text-brand-main"
                        >
                            {greetings[greetingIndex]}
                        </motion.h1>
                    </AnimatePresence>
                </div>
                <p className="text-muted-foreground">Ingrese su ID para ver su perfil</p>
            </div>

            <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    {/* Hidden input for form submission */}
                    <input type="hidden" name="short_id" value={`${prefix}-${suffix}`} />
                    
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 group">
                            <Input 
                                value={prefix}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    
                                    // Handle paste of full ID (e.g. MTR-1234 or DOC1234)
                                    // We check if it contains a dash OR if it starts with letters and has trailing numbers
                                    const fullIdMatch = val.match(/^([A-Z]+)[-](\d+)/) || val.match(/^([A-Z]+)(\d{2,})$/);
                                    
                                    if (fullIdMatch) {
                                        // It's a full ID paste
                                        const p = fullIdMatch[1];
                                        const s = fullIdMatch[2];
                                        
                                        // Update state with cleaned parts
                                        setPrefix(p.substring(0, 5));
                                        setSuffix(s.substring(0, 6)); 
                                        
                                        // Focus next field
                                        suffixInputRef.current?.focus();
                                        return;
                                    }

                                    // Validating standard typing for Prefix input
                                    // If the user typed a dash, ignore it but try to shift focus if prefix is valid
                                    if (val.includes('-')) {
                                         const clean = val.replace(/-/g, '');
                                         if (clean.length > 0) {
                                             setPrefix(clean.substring(0, 5));
                                             suffixInputRef.current?.focus();
                                         }
                                         return;
                                    }

                                    // Normal typing: keep only letters, max 5 chars
                                    const newPrefix = val.replace(/[^A-Z]/g, '').substring(0, 5);
                                    setPrefix(newPrefix);

                                    // Auto-focus logic
                                    const knownPrefixes = ['DOC', 'MTR', 'LIC', 'EST', 'UIM', 'STAFF'];
                                    if (knownPrefixes.includes(newPrefix) || newPrefix.length >= 5) {
                                        suffixInputRef.current?.focus();
                                    }
                                }}
                                placeholder="DOC" 
                                className="text-center text-lg h-14 tracking-widest uppercase placeholder:normal-case placeholder:text-xs placeholder:text-muted-foreground/70 border-brand-light/50 focus-visible:ring-brand-secondary/50 focus-visible:border-brand-secondary transition-all bg-background group-hover:border-brand-light" 
                                required 
                            />
                        </div>
                        
                        <span className="text-4xl font-black select-none pb-1">–</span>
                        
                        <div className="relative flex-1 group">
                             <Input 
                                ref={suffixInputRef}
                                value={suffix}
                                onChange={(e) => {
                                    // Only numbers
                                    setSuffix(e.target.value.replace(/[^0-9]/g, ''));
                                }}
                                placeholder="1234" 
                                className="text-center text-lg h-14 tracking-widest uppercase placeholder:normal-case placeholder:text-xs placeholder:text-muted-foreground/70 border-brand-light/50 focus-visible:ring-brand-secondary/50 focus-visible:border-brand-secondary transition-all bg-background group-hover:border-brand-light" 
                                required 
                                maxLength={6}
                            />
                        </div>
                    </div>
                </div>
                
                {error && <p className="text-destructive text-sm text-center animate-pulse">{error}</p>}

                <SubmitButton />
                
                <div className="flex justify-center">
                    <button 
                        type="button"
                        onClick={() => setShowRecovery(true)}
                        className="text-xs text-muted-foreground hover:text-brand-main transition-colors hover:underline"
                    >
                        ¿Olvido su ID?
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-dashed border-brand-light/30 text-center">
                <p className="text-sm text-muted-foreground mb-4">¿No tiene un registro?</p>
                <Button variant="outline" className="w-full border-brand-main/20 hover:bg-brand-lightest hover:text-brand-darkest transition-colors mb-2" onClick={onRegisterClick}>
                    Crear Nuevo Registro
                </Button>
            </div>

            <AccountRecoveryModal 
                isOpen={showRecovery} 
                onClose={() => setShowRecovery(false)} 
                onLogin={handleRecoveredId} 
            />
        </div>
    )
}
