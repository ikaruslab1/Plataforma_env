"use client"

import { useState } from "react"
import { ClipboardCopyIcon, DownloadIcon, CheckIcon } from "lucide-react"
import { BeneficiaryReportItem } from "@/app/actions"

function SingleReportTable({ title, data, filenamePrefix }: { title: string, data: BeneficiaryReportItem[], filenamePrefix: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        const headers = [
            "Nombre", "Apellidos", "CURP", "Código de identidad", 
            "Correo electrónico", "Correo alterno", "Nivel de estudios",
            "Fecha de inicio", "Fecha de termino", "Calificación",
            "Nacionalidad", "Género", "Fecha de nacimiento"
        ]

        const rows = data.map(item => [
            item.nombre,
            item.apellidos,
            item.curp,
            item.codigo_identidad,
            item.correo_electronico,
            item.correo_alterno,
            item.nivel_estudios,
            item.fecha_inicio,
            item.fecha_termino,
            item.calificacion,
            item.nacionalidad,
            item.genero,
            item.fecha_nacimiento
        ])

        const tsv = [
            headers.join("\t"),
            ...rows.map(row => row.join("\t"))
        ].join("\n")

        navigator.clipboard.writeText(tsv).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleExportCSV = () => {
        const headers = [
            "Nombre", "Apellidos", "CURP", "Código de identidad", 
            "Correo electrónico", "Correo alterno", "Nivel de estudios",
            "Fecha de inicio", "Fecha de termino", "Calificación",
            "Nacionalidad", "Género", "Fecha de nacimiento"
        ]

        const rows = data.map(item => [
            `"${item.nombre}"`,
            `"${item.apellidos}"`,
            `"${item.curp}"`,
            `"${item.codigo_identidad}"`,
            `"${item.correo_electronico}"`,
            `"${item.correo_alterno}"`,
            `"${item.nivel_estudios}"`,
            `"${item.fecha_inicio}"`,
            `"${item.fecha_termino}"`,
            `"${item.calificacion}"`,
            `"${item.nacionalidad}"`,
            `"${item.genero}"`,
            `"${item.fecha_nacimiento}"`
        ])

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `${filenamePrefix}_sigeco.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-4">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <p className="text-muted-foreground text-xs">
                        Total filtrado: <span className="font-bold text-gray-900">{data.length}</span> registros.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        {copied ? <CheckIcon className="h-3.5 w-3.5 text-green-600" /> : <ClipboardCopyIcon className="h-3.5 w-3.5" />}
                        {copied ? "Copiado" : "Copiar (Excel)"}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <DownloadIcon className="h-3.5 w-3.5" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-xs text-gray-500 whitespace-nowrap">
                        <thead className="bg-gray-50 uppercase text-gray-700 font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 border-b">Nombre</th>
                                <th className="px-4 py-3 border-b">Apellidos</th>
                                <th className="px-4 py-3 border-b">CURP</th>
                                <th className="px-4 py-3 border-b">Cód. Identidad</th>
                                <th className="px-4 py-3 border-b">Correo</th>
                                <th className="px-4 py-3 border-b">Correo Alt.</th>
                                <th className="px-4 py-3 border-b">Nivel</th>
                                <th className="px-4 py-3 border-b">F. Inicio</th>
                                <th className="px-4 py-3 border-b">F. Término</th>
                                <th className="px-4 py-3 border-b">Calif.</th>
                                <th className="px-4 py-3 border-b">Nacionalidad</th>
                                <th className="px-4 py-3 border-b">Género</th>
                                <th className="px-4 py-3 border-b">F. Nacimiento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2 font-medium text-gray-900">{item.nombre}</td>
                                    <td className="px-4 py-2">{item.apellidos}</td>
                                    <td className="px-4 py-2 font-mono">{item.curp}</td>
                                    <td className="px-4 py-2 bg-gray-50/50"></td>
                                    <td className="px-4 py-2">{item.correo_electronico}</td>
                                    <td className="px-4 py-2">{item.correo_alterno}</td>
                                    <td className="px-4 py-2">{item.nivel_estudios}</td>
                                    <td className="px-4 py-2 font-mono">{item.fecha_inicio}</td>
                                    <td className="px-4 py-2 font-mono">{item.fecha_termino}</td>
                                    <td className="px-4 py-2 bg-gray-50/50"></td>
                                    <td className="px-4 py-2 bg-gray-50/50"></td>
                                    <td className="px-4 py-2">{item.genero}</td>
                                    <td className="px-4 py-2 bg-gray-50/50"></td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={13} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No se encontraron registros para esta categoría.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export function BeneficiaryReportTable({ asistentes, ponentes }: { asistentes: BeneficiaryReportItem[], ponentes: BeneficiaryReportItem[] }) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Constancia de Asistencia para SIGECO</h2>
                <p className="text-muted-foreground">
                    Reporte de usuarios que cumplen con el 70% de asistencia, clasificados por tipo de participación.
                </p>
            </div>

            <SingleReportTable 
                title="1. Tabla de Asistentes" 
                data={asistentes} 
                filenamePrefix="asistentes"
            />

            <SingleReportTable 
                title="2. Tabla de Ponentes" 
                data={ponentes} 
                filenamePrefix="ponentes"
            />
            
            <p className="text-xs text-gray-400 text-right pt-4 border-t">
                * Las fechas están en formato dd-mm-aa. Las columnas vacías son requeridas por la estructura de exportación.
            </p>
        </div>
    )
}
