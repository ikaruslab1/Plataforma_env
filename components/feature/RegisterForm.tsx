"use client"

import { useFormState } from "react-dom"
import { registerUser } from "@/app/actions"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useEffect, useState } from "react"

const initialState = {
  success: false,
  message: "",
  errors: {},
}

export function RegisterForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction] = useFormState(registerUser, initialState)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true)
    }
  }, [state?.success])

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-card rounded-xl shadow-lg border border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-center text-foreground font-sans">Nuevo Registro</h2>
      
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input name="nombre" placeholder="Ej. Juan" required />
            {state?.errors?.nombre && <p className="text-destructive text-xs">{state.errors.nombre}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Apellido</label>
            <Input name="apellido" placeholder="Ej. Pérez" required />
            {state?.errors?.apellido && <p className="text-destructive text-xs">{state.errors.apellido}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Grado Académico</label>
            <Select name="grado" required>
              <option value="">Seleccionar...</option>
              <option value="Doctorado">Doctorado</option>
              <option value="Maestría">Maestría</option>
              <option value="Licenciatura">Licenciatura</option>
              <option value="Estudiante">Estudiante</option>
            </Select>
            {state?.errors?.grado && <p className="text-destructive text-xs">{state.errors.grado}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Género</label>
            <Select name="genero" required>
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Neutro">Neutro</option>
            </Select>
            {state?.errors?.genero && <p className="text-destructive text-xs">{state.errors.genero}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">CURP</label>
          <Input name="curp" placeholder="CLAVE CURP 18 DIGITOS" maxLength={18} className="uppercase" required />
          {state?.errors?.curp && <p className="text-destructive text-xs">{state.errors.curp}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
            <label className="text-sm font-medium">Correo Electrónico</label>
            <Input name="correo" type="email" placeholder="correo@ejemplo.com" required />
             {state?.errors?.correo && <p className="text-destructive text-xs">{state.errors.correo}</p>}
            </div>
            <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar Correo</label>
            <Input name="confirmarCorreo" type="email" placeholder="Confirmar..." required />
             {state?.errors?.confirmarCorreo && <p className="text-destructive text-xs">{state.errors.confirmarCorreo[0]}</p>}
            </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Teléfono</label>
          <Input name="telefono" type="tel" placeholder="10 Dígitos" maxLength={15} required />
          {state?.errors?.telefono && <p className="text-destructive text-xs">{state.errors.telefono}</p>}
        </div>

        {state?.message && !state.success && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md animate-in fade-in">
            {state.message}
          </div>
        )}

        <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="w-full" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" className="w-full">Registrar</Button>
        </div>
      </form>

      <Dialog isOpen={showSuccess} onClose={() => { setShowSuccess(false); onCancel(); }} title="¡Registro Exitoso!">
        <div className="space-y-4 text-center">
            <p className="text-muted-foreground">Tu perfil ha sido creado correctamente.</p>
            <div className="bg-secondary p-4 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">ID de Acceso</p>
                <p className="text-3xl font-bold tracking-wider text-primary mt-2 font-mono">{state?.data?.short_id}</p>
            </div>
            <p className="text-sm text-balance">Guarda este ID en un lugar seguro. Lo necesitarás para ingresar a tu perfil académico.</p>
            <Button className="w-full" onClick={() => { setShowSuccess(false); onCancel(); }}>Entendido</Button>
        </div>
      </Dialog>
    </div>
  )
}
