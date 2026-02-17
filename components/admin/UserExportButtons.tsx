"use client"

import { Button } from "@/components/ui/Button"
import { DownloadIcon, CopyIcon, CheckIcon } from "lucide-react"
import { useState } from "react"

type Profile = {
  id: string
  short_id: string
  nombre: string
  apellido: string
  grado: string
  genero: string
  correo: string
  telefono: string
  participacion: string
  created_at: string
  event_attendance: {
    is_interested: boolean
    has_attended: boolean
    events: {
      name: string
    }
  }[]
}

interface UserExportButtonsProps {
  users: Profile[]
}

export function UserExportButtons({ users }: UserExportButtonsProps) {
  const [isCopied, setIsCopied] = useState(false)

  const formatDataForExport = (separator: string) => {
    // Define headers
    const headers = [
      "ID Corto",
      "Nombre",
      "Apellido",
      "Grado",
      "Género",
      "Correo",
      "Teléfono",
      "Participación",
      "Fecha Registro",
      "Eventos Asistidos",
      "Eventos Interesados"
    ]

    const headerRow = headers.join(separator)

    const rows = users.map(user => {
      const attendedEvents = user.event_attendance
        .filter(ea => ea.has_attended)
        .map(ea => ea.events?.name || "Evento desconocido")
        .join("; ")
      
      const interestedEvents = user.event_attendance
        .filter(ea => ea.is_interested && !ea.has_attended)
        .map(ea => ea.events?.name || "Evento desconocido")
        .join("; ")

      const rowData = [
        user.short_id || "",
        user.nombre || "",
        user.apellido || "",
        user.grado || "",
        user.genero || "",
        user.correo || "",
        user.telefono || "",
        user.participacion || "Asistente",
        user.created_at ? new Date(user.created_at).toLocaleDateString("es-MX") : "",
        attendedEvents,
        interestedEvents
      ]

      // Escape quotes and wrap in quotes if necessary for CSV
      if (separator === ",") {
        return rowData.map(field => {
            const stringField = String(field);
            if (stringField.includes(",") || stringField.includes("\"") || stringField.includes("\n")) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        }).join(separator);
      }
      
      return rowData.join(separator)
    })

    return [headerRow, ...rows].join("\n")
  }

  const handleDownloadCSV = () => {
    try {
      const csvContent = formatDataForExport(",")
      // Add BOM for Excel to recognize UTF-8
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `usuarios_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      console.log("Archivo CSV descargado correctamente")
    } catch (error) {
      console.error("Error downloading CSV:", error)
      alert("Error al descargar el archivo CSV")
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      const tsvContent = formatDataForExport("\t")
      await navigator.clipboard.writeText(tsvContent)
      setIsCopied(true)
      console.log("Datos copiados al portapapeles (formato Excel)")
      
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      console.error("Error al copiar los datos")
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDownloadCSV}
        className="flex items-center gap-2 bg-white"
        title="Descargar CSV"
      >
        <DownloadIcon className="h-4 w-4" />
        <span className="hidden sm:inline">CSV</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleCopyToClipboard}
        className="flex items-center gap-2 bg-white"
        title="Copiar para Excel"
      >
        {isCopied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <CopyIcon className="h-4 w-4" />}
        <span className="hidden sm:inline">Excel</span>
      </Button>
    </div>
  )
}
