"use client"

import { useFormState } from "react-dom"
import { registerUser } from "@/app/actions"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

const initialState = {
  success: false,
  message: "",
  errors: {},
}

export function RegisterForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction] = useFormState(registerUser, initialState)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    grado: "",
    genero: "",
    participacion: "",
    curp: "",
    correo: "",
    confirmarCorreo: "",
    telefono: ""
  })

  // Load from Local Storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("academic_register_form")
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (e) {
        console.error("Error loading form data", e)
      }
    }
  }, [])

  // Handle existing CURP redirection
  useEffect(() => {
    if (state?.success) {
      localStorage.removeItem("academic_register_form")
      if (state.data?.short_id) {
        router.push(`/profile/${state.data.short_id}?welcome=true`)
      }
    }
    
    // Show dialog if CURP is registered
    if (state?.curpRegistered) {
        setShowExistDialog(true)
    }
  }, [state?.success, state?.data?.short_id, state?.curpRegistered, router])

  const [showExistDialog, setShowExistDialog] = useState(false)

  const handleGoToRecovery = () => {
      setShowExistDialog(false)
      onCancel() // Switch to login view
      router.replace('/?recover=true') // Trigger recovery modal in logic
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // Auto-uppercase CURP for better UX
    const newValue = name === 'curp' ? value.toUpperCase() : value;
    
    const newFormData = { ...formData, [name]: newValue }
    setFormData(newFormData)
    localStorage.setItem("academic_register_form", JSON.stringify(newFormData))
  }

  const hasErrors = !state.success && (state.message || (state.errors && Object.keys(state.errors).length > 0));

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-card rounded-xl shadow-lg border border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-center text-foreground font-sans">Nuevo Registro</h2>
      
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre*</label>
            <Input 
              name="nombre" 
              placeholder="Nombre" 
              required 
              value={formData.nombre}
              onChange={handleChange}
            />
            {state?.errors?.nombre && <p className="text-destructive text-xs">{state.errors.nombre}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Apellidos*</label>
            <Input 
              name="apellido" 
              placeholder="Apellido paterno y materno" 
              required 
              value={formData.apellido}
              onChange={handleChange}
            />
            {state?.errors?.apellido && <p className="text-destructive text-xs">{state.errors.apellido}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Grado Académico*</label>
            <Select 
              name="grado" 
              required
              value={formData.grado}
              onChange={handleChange}
            >
              <option value="">Seleccionar...</option>
              <option value="Doctorado">Doctorado</option>
              <option value="Maestría">Maestría</option>
              <option value="Licenciatura">Licenciatura</option>
              <option value="Estudiante">Estudiante</option>
            </Select>
            {state?.errors?.grado && <p className="text-destructive text-xs">{state.errors.grado}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Género*</label>
            <Select 
              name="genero" 
              required
              value={formData.genero}
              onChange={handleChange}
            >
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Neutro">Neutro</option>
            </Select>
            {state?.errors?.genero && <p className="text-destructive text-xs">{state.errors.genero}</p>}
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">Participación*</label>
            <Select 
              name="participacion" 
              required
              value={formData.participacion}
              onChange={handleChange}
            >
                <option value="">Seleccionar...</option>
                <option value="Ponente">Ponente</option>
                <option value="Asistente">Asistente</option>
            </Select>
            {state?.errors?.participacion && <p className="text-destructive text-xs">{state.errors.participacion}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">CURP*</label>
          <Input 
            name="curp" 
            placeholder="CLAVE CURP 18 DIGITOS" 
            maxLength={18} 
            className="uppercase" 
            required 
            value={formData.curp}
            onChange={handleChange}
          />
          {state?.errors?.curp && <p className="text-destructive text-xs">{state.errors.curp}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
            <label className="text-sm font-medium">Correo Electrónico*</label>
            <Input 
              name="correo" 
              type="email" 
              placeholder="correo@ejemplo.com" 
              required 
              value={formData.correo}
              onChange={handleChange}
            />
             {state?.errors?.correo && <p className="text-destructive text-xs">{state.errors.correo}</p>}
            </div>
            <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar Correo*</label>
            <Input 
              name="confirmarCorreo" 
              type="email" 
              placeholder="Confirmar..." 
              required 
              value={formData.confirmarCorreo}
              onChange={handleChange}
            />
             {state?.errors?.confirmarCorreo && <p className="text-destructive text-xs">{state.errors.confirmarCorreo[0]}</p>}
            </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Teléfono*</label>
          <Input 
            name="telefono" 
            type="tel" 
            placeholder="10 Dígitos (sin lada)" 
            maxLength={15} 
            required 
            value={formData.telefono}
            onChange={handleChange}
          />
          {state?.errors?.telefono && <p className="text-destructive text-xs">{state.errors.telefono}</p>}
        </div>

        {hasErrors && (
          <div className="p-4 bg-red-50/50 border border-red-200 text-red-600 text-sm rounded-lg animate-in fade-in slide-in-from-top-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Corrige los siguientes errores:</span>
            </div>
            {state.message && state.message !== "Error de validación. Revisa los campos." && (
               <p>{state.message}</p>
            )}
            {state.errors && Object.keys(state.errors).length > 0 && (
                <ul className="list-disc list-inside space-y-1 ml-1">
                    {Object.entries(state.errors).map(([field, msgs]) => (
                        <li key={field}>
                           <span className="font-medium capitalize">{field}:</span> {msgs[0]}
                        </li>
                    ))}
                </ul>
            )}
          </div>
        )}

        <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="w-full" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" className="w-full">Registrar</Button>
        </div>
      </form>

      <Dialog 
        isOpen={showExistDialog} 
        onClose={() => setShowExistDialog(false)}
        title="Cuenta Existente"
      >
        <div className="space-y-4">
            <p className="text-muted-foreground">
                La CURP ingresada ya se encuentra registrada en el sistema.
            </p>
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-900 border border-amber-200">
                Si olvidaste tu ID de acceso, puedes recuperarlo utilizando tu CURP.
            </div>
            <div className="flex flex-col gap-2 pt-2">
                <Button onClick={handleGoToRecovery} className="w-full">
                    Ir a Recuperación de ID
                </Button>
                <Button variant="outline" onClick={() => setShowExistDialog(false)} className="w-full">
                    Corregir CURP
                </Button>
            </div>
        </div>
      </Dialog>
    </div>
  )
}
