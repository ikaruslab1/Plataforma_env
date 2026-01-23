"use client"

import { useState } from "react"
import { QrCode, UserCheck, X, CheckCircle, AlertCircle, Calendar } from "lucide-react"
import { QRScannerModal, ScannedData } from "./QRScannerModal"
import { confirmEventAttendanceAction } from "@/app/actions"

// Define Event type locally or import if shared
type Event = {
  id: string
  name: string
}

export function AdminCheckIn({ events }: { events: Event[] }) {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedData | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleScanSuccess = (data: ScannedData) => {
    setScannedData(data)
    setIsScannerOpen(false)
    setErrorMsg(null)
    // Removed auto-success message here, waiting for manual confirmation
  }

  const handleScanError = (msg: string) => {
    setErrorMsg(msg)
    setIsScannerOpen(false)
  }

  const handleClear = () => {
    setScannedData(null)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleConfirmAttendance = async () => {
    if (!scannedData || !selectedEventId) {
      setErrorMsg("Debes seleccionar un evento y escanear un usuario.")
      return
    }

    setIsConfirming(true)
    try {
      // Extract Short ID (assuming it is the third part of QR or passed explicitly in ScannedData)
      // The scanner logic sets `id` as `parts[2]` which is the short_id.
      const res = await confirmEventAttendanceAction(scannedData.id, selectedEventId)
      
      if (res.success) {
        setSuccessMsg(res.message || "Asistencia registrada exitosamente.")
        setScannedData(null) // Reset for next scan
        setTimeout(() => setSuccessMsg(null), 4000)
      } else {
        setErrorMsg(res.message || "Error al registrar asistencia.")
      }
    } catch (err) {
      console.error(err)
      setErrorMsg("Ocurrió un error inesperado.")
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full mb-8">
      {/* Selector de Evento */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg text-white">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">
          Modo de Operación
        </label>
        <div className="flex items-center gap-4">
          <Calendar className="w-8 h-8 text-indigo-400"/>
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-gray-700/50 border border-gray-600 text-white text-lg rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
          >
            <option value="" disabled>-- Selecciona el Evento Activo --</option>
            {events?.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sección de Acción Principal */}
      <div className={`
        flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm transition-all
        ${!selectedEventId ? 'opacity-50 pointer-events-none grayscale' : ''}
      `}>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Check-in de Asistentes</h2>
          <p className="text-xs text-gray-500">
            {selectedEventId ? "Sistema listo para escanear" : "Selecciona un evento primero"}
          </p>
        </div>
        <button
          onClick={() => setIsScannerOpen(true)}
          disabled={!selectedEventId}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 font-medium text-sm disabled:bg-gray-400"
        >
          <QrCode className="w-4 h-4" />
          Escanear Asistente
        </button>
      </div>

      {/* Feedback Visual: Errores */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2">
             <AlertCircle className="w-5 h-5" />
             <span className="text-sm font-medium">{errorMsg}</span>
           </div>
           <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded-full transition-colors">
              <X className="w-4 h-4 opacity-60 hover:opacity-100"/>
           </button>
        </div>
      )}
      
      {/* Feedback Visual: Éxito */}
      {successMsg && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
           <CheckCircle className="w-5 h-5" />
           <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Formulario de Visualización de Datos */}
      {scannedData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <UserCheck className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirmar Asistencia</h3>
            </div>
            <button
               onClick={handleClear}
               className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5"/>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Asistente
              </label>
              <div className="font-medium text-lg text-gray-900 border-b border-gray-100 pb-1">
                {scannedData.name}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Grado / Perfil
              </label>
              <div className="font-medium text-gray-700 border-b border-gray-100 pb-1">
                {scannedData.degree}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                ID Sistema
              </label>
               <div className="font-mono text-indigo-600 font-bold border-b border-gray-100 pb-1">
                {scannedData.id}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button 
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium hover:underline transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmAttendance}
              disabled={isConfirming}
              className={`
                px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transform transition-all flex items-center gap-2
                ${isConfirming 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5"
                }
              `}
            >
              {isConfirming ? "Procesando..." : "Confirmar Asistencia"}
              {!isConfirming && <CheckCircle className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Componente Modal del Escáner */}
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        onError={handleScanError}
      />
    </div>
  )
}
