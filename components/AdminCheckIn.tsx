"use client"

import { useState } from "react"
import { QrCode, UserCheck, X, CheckCircle, AlertCircle } from "lucide-react"
import { QRScannerModal, ScannedData } from "./QRScannerModal"

export function AdminCheckIn() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleScanSuccess = (data: ScannedData) => {
    setScannedData(data)
    setIsScannerOpen(false)
    setErrorMsg(null)
    setSuccessMsg("¡Código escaneado correctamente!")
    
    // Auto-ocultar el mensaje de éxito después de un tiempo
    setTimeout(() => setSuccessMsg(null), 3000)
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

  return (
    <div className="flex flex-col gap-6 w-full mb-8">
      {/* Sección de Acción Principal */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Check-in de Asistentes</h2>
          <p className="text-xs text-gray-500">Escanea el código QR para validar el ingreso</p>
        </div>
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all shadow-md active:scale-95 font-medium text-sm"
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
              <h3 className="text-lg font-bold">Identidad Verificada</h3>
            </div>
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/30">
              Datos del QR
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nombre Completo
              </label>
              <input 
                type="text" 
                readOnly 
                value={scannedData.name} 
                className="w-full bg-gray-50 border-0 border-b-2 border-gray-200 rounded-t-lg px-3 py-2 text-gray-900 font-semibold focus:ring-0 focus:border-indigo-500 transition-colors"
                title="Nombre extraído del QR"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Grado Académico
              </label>
              <input 
                type="text" 
                readOnly 
                value={scannedData.degree} 
                className="w-full bg-gray-50 border-0 border-b-2 border-gray-200 rounded-t-lg px-3 py-2 text-gray-900 font-medium focus:ring-0 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                ID de Registro
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  readOnly 
                  value={scannedData.id} 
                  className="w-full bg-blue-50/50 border-0 border-b-2 border-blue-200 text-blue-800 font-mono text-lg tracking-wide rounded-t-lg px-3 py-2 focus:ring-0"
                />
                <div className="absolute right-2 top-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button 
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium hover:underline transition-all"
            >
              Cerrar Vista
            </button>
            <button 
              onClick={() => {
                handleClear()
                setIsScannerOpen(true)
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transform transition hover:-translate-y-0.5"
            >
              Validar y Siguiente
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
