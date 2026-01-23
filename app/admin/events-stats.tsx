"use client"

import { useState } from "react"
import { CalendarIcon, UsersIcon, CheckCircleIcon, UserIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Profile = {
  short_id: string
  nombre: string
  apellido: string
  grado: string
  genero: string
}

type AttendanceRecord = {
  is_interested: boolean
  has_attended: boolean
  profiles: Profile
}

type EventWithStats = {
  id: string
  name: string
  description: string
  event_date: string
  event_attendance: AttendanceRecord[]
}

function getInterestedLabel(gender: string) {
  if (gender === 'Femenino') return 'Interesada'
  if (gender === 'Neutro') return 'Interesade'
  return 'Interesado'
}

export function EventsStats({ events }: { events: EventWithStats[] }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-semibold mb-2">Estadísticas por Evento</h2>
          <p className="text-muted-foreground text-sm">Visualiza el interés y asistencia detallada de cada actividad.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {events.map((event) => (
          <EventStatCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
             <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                 No hay eventos registrados.
             </div>
        )}
      </div>
    </div>
  )
}

function EventStatCard({ event }: { event: EventWithStats }) {
  const [isOpen, setIsOpen] = useState(false)

  const interestedList = event.event_attendance.filter(r => r.is_interested)
  const attendedList = event.event_attendance.filter(r => r.has_attended)

  // Combined list for display to avoid duplicates if someone is both (though distinct logic usually separates them or we use tags)
  // Usually "Attended" implies they went. "Interested" implies they plan to go.
  // The user asked "quienes van a ir".
  
  // Let's sort profiles by name
  const sortedAttendance = [...event.event_attendance].sort((a, b) => 
    (a.profiles?.nombre || "").localeCompare(b.profiles?.nombre || "")
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
            <h3 className="font-bold text-lg text-gray-900">{event.name}</h3>
            <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="mr-1.5 h-4 w-4" />
                {new Intl.DateTimeFormat("es-MX", { dateStyle: "full", timeStyle: "short" }).format(new Date(event.event_date))}
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
                <span className="text-xl md:text-2xl font-bold text-blue-600">{interestedList.length}</span>
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wider">Interesados</span>
            </div>
            <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
            <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
                <span className="text-xl md:text-2xl font-bold text-emerald-600">{attendedList.length}</span>
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wider">Asistieron</span>
            </div>
            <div className="ml-2 text-gray-400">
                {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </div>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <UsersIcon className="h-4 w-4 mr-2" />
                Lista de Participantes ({sortedAttendance.length})
            </h4>
            
            {sortedAttendance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sortedAttendance.map((record, idx) => {
                        const p = record.profiles
                        if (!p) return null
                        return (
                            <div key={idx} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs mr-3 shrink-0">
                                    {p.nombre.charAt(0)}{p.apellido.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {p.nombre} {p.apellido}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{p.short_id}</span>
                                        <span>•</span>
                                        <span>{p.grado}</span>
                                    </div>
                                </div>
                                <div className="ml-2 flex flex-col gap-1 items-end">
                                    {record.has_attended && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                            Asistió
                                        </span>
                                    )}
                                    {record.is_interested && !record.has_attended && (
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                            {getInterestedLabel(p.genero)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No hay registros de actividad para este evento.</p>
            )}
        </div>
      )}
    </div>
  )
}
