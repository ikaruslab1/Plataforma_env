"use client"

import { Scanner } from "@yudiel/react-qr-scanner"
import { X, Camera } from "lucide-react"

// Definimos la estructura de los datos escaneados
export type ScannedData = {
  name: string
  degree: string
  id: string
}

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (data: ScannedData) => void
  onError: (message: string) => void
}

export function QRScannerModal({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  onError 
}: QRScannerModalProps) {
  
  if (!isOpen) return null

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue
      
      // Parse Logic: "Nombre Completo | Grado | ID"
      if (!rawValue) return

      const parts = rawValue.split("|").map((s: string) => s.trim())
      
      if (parts.length >= 3) {
        // Éxito: tenemos al menos 3 partes
        onScanSuccess({
          name: parts[0],
          degree: parts[1],
          id: parts[2]
        })
      } else {
        // Error: formato inválido
        onError("El código QR no es válido para este sistema.")
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-800">
            <Camera className="w-5 h-5" />
            <h2 className="text-lg font-bold">Escanear Asistente</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scanner Area */}
        <div className="w-full aspect-square bg-black relative">
          <Scanner 
            onScan={handleScan}
            // Configuramos componentes para limpiar la UI
            components={{
              torch: true,
              zoom: true,
              finder: true,
            }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { objectFit: 'cover' }
            }}
          />
          <div className="absolute inset-0 pointer-events-none border-[30px] border-black/50"></div>
        </div>

        {/* Footer Instructions */}
        <div className="p-4 w-full bg-gray-50 text-center">
          <p className="text-sm text-gray-500">
            Apunta la cámara al código QR del gafete o celular.
          </p>
        </div>

      </div>
    </div>
  )
}
