
"use client"

import { useState } from "react"
import { CalendarIcon, MapPinIcon, CheckCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toggleEventInterest } from "@/app/actions"
// import { toast } from "sonner" // Assuming sonner or similar is used, or generic alert for now

interface Event {
  id: string
  name: string
  description: string
  event_date: string
}

interface Attendance {
  event_id: string
  is_interested: boolean
  has_attended: boolean
}

interface EventAgendaProps {
  events: Event[]
  initialAttendance: Attendance[]
  shortId: string
}

export function EventAgenda({ events, initialAttendance, shortId }: EventAgendaProps) {
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const handleInterestToggle = async (eventId: string) => {
    setLoadingIds(prev => new Set(prev).add(eventId))
    
    // Optimistic update
    const isCurrentlyInterested = attendance.find(a => a.event_id === eventId)?.is_interested || false
    
    // Update local state temporarily
    setAttendance(prev => {
      const existing = prev.find(a => a.event_id === eventId)
      if (existing) {
        return prev.map(a => a.event_id === eventId ? { ...a, is_interested: !a.is_interested } : a)
      } else {
        return [...prev, { event_id: eventId, is_interested: !isCurrentlyInterested, has_attended: false }]
      }
    })

    try {
      const res = await toggleEventInterest(shortId, eventId)
      if (!res.success) {
        // Revert if error
        alert("Error al actualizar interés") // Simple alert for now as I don't see a toast lib installed yet
        
        // Revert local state
        setAttendance(prev => {
            const existing = prev.find(a => a.event_id === eventId)
            if (existing) {
                return prev.map(a => a.event_id === eventId ? { ...a, is_interested: isCurrentlyInterested } : a)
            }
            return prev.filter(a => a.event_id !== eventId)
        })
      }
    } catch (error) {
      console.error(error)
      // Revert on error logic same as above...
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  if (events.length === 0) return null

  return (
    <div className="w-full max-w-md mt-8 space-y-6">
        <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Agenda del Evento</h2>
            <p className="text-sm text-muted-foreground">Marca los eventos que te interesan para recibir recordatorios.</p>
        </div>

        <div className="space-y-4">
            {events.map((event) => {
                const attended = attendance.find(a => a.event_id === event.id)?.has_attended
                const interested = attendance.find(a => a.event_id === event.id)?.is_interested
                const isLoading = loadingIds.has(event.id)
                const date = new Date(event.event_date)

                return (
                    <div 
                        key={event.id}
                        className={cn(
                            "relative group flex flex-col p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md",
                            interested ? "border-primary/50 bg-primary/5" : "border-border"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                <CalendarIcon className="mr-1 h-3 w-3" />
                                {new Intl.DateTimeFormat("es-MX", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(date)}
                            </div>
                            {attended && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    ¡Asististe!
                                </span>
                            )}
                        </div>

                        <h3 className="font-semibold text-lg leading-tight mb-1">{event.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>

                        <button
                            onClick={() => handleInterestToggle(event.id)}
                            disabled={isLoading || attended}
                            className={cn(
                                "mt-auto w-full inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
                                interested 
                                    ? "bg-primary text-primary-foreground shadow hover:bg-primary/90" 
                                    : "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            {isLoading ? (
                                <span className="animate-spin mr-2">⏳</span> 
                            ) : interested ? (
                                <>
                                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                                    Te interesa
                                </>
                            ) : (
                                "Me interesa"
                            )}
                        </button>
                    </div>
                )
            })}
        </div>
    </div>
  )
}
