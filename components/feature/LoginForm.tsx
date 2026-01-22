"use client"
import { useFormStatus } from "react-dom"
import { verifyUser } from "@/app/actions"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useState } from "react"
import { useRouter } from "next/navigation"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button className="w-full h-11" disabled={pending}>
            {pending ? "Verificando..." : "Ingresar"}
        </Button>
    )
}

export function LoginForm({ onRegisterClick }: { onRegisterClick: () => void }) {
    const [error, setError] = useState("")
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setError("")
        const res = await verifyUser(formData)
        if (res?.error) {
            setError(res.error)
        } else if (res?.redirectUrl) {
           router.push(res.redirectUrl)
        }
    }

    return (
        <div className="w-full max-w-sm mx-auto p-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
                <div className="h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-lg">
                    AP
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Bienvenido</h1>
                <p className="text-muted-foreground">Ingresa tu ID para ver tu perfil</p>
            </div>

            <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Input 
                        name="short_id" 
                        placeholder="ID Corto (ej. LIC-8921)" 
                        className="text-center text-lg h-12 tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-sm" 
                        required 
                    />
                </div>
                
                {error && <p className="text-destructive text-sm text-center animate-pulse">{error}</p>}

                <SubmitButton />
            </form>

            <div className="mt-10 pt-6 border-t border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground mb-4">¿No tienes un registro?</p>
                <Button variant="outline" className="w-full" onClick={onRegisterClick}>
                    Crear Nuevo Registro
                </Button>
            </div>
        </div>
    )
}
