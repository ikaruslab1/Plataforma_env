
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
  userGender?: string
}

export function EventAgenda({ events, initialAttendance, shortId, userGender }: EventAgendaProps) {
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const getInterestedLabel = () => {
      if (userGender === 'Femenino') return 'Interesada'
      if (userGender === 'Neutro') return 'Interesade'
      return 'Interesado'
  }


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
        alert("Error al actualizar interés") 
        
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
    <div className="w-full max-w-md mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Agenda del Evento</h2>
            <p className="text-sm text-muted-foreground">Marca los eventos que te interesan.</p>
        </div>

        <div className="space-y-4">
            {events.map((event) => {
                const attended = attendance.find(a => a.event_id === event.id)?.has_attended
                const interested = attendance.find(a => a.event_id === event.id)?.is_interested
                const isLoading = loadingIds.has(event.id)
                const date = new Date(event.event_date)

                // Determine Card Style based on state
                let cardStyle = "bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md"
                let buttonStyle = "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                let dateBadgeStyle = "bg-gray-100 text-gray-500"

                if (attended) {
                    cardStyle = "bg-emerald-500 border-emerald-600 text-white shadow-md ring-1 ring-emerald-600"
                    buttonStyle = "bg-white/20 hover:bg-white/30 text-white border-transparent backdrop-blur-sm"
                    dateBadgeStyle = "bg-emerald-600/50 text-emerald-50"
                } else if (interested) {
                    cardStyle = "bg-gray-900 border-gray-800 text-white shadow-lg ring-1 ring-gray-950"
                    buttonStyle = "bg-white/10 hover:bg-white/20 text-white border-transparent backdrop-blur-sm"
                    dateBadgeStyle = "bg-gray-800 text-gray-300"
                }

                return (
                    <div 
                        key={event.id}
                        className={cn(
                            "relative group flex flex-col p-4 md:p-5 rounded-xl border transition-all duration-300",
                            cardStyle
                        )}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-md transition-colors", dateBadgeStyle)}>
                                <CalendarIcon className="mr-1 h-3 w-3" />
                                {new Intl.DateTimeFormat("es-MX", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(date)}
                            </div>
                            {attended && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-white text-emerald-600">
                                    ¡Asististe!
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-base md:text-lg leading-tight mb-2 tracking-tight">{event.name}</h3>
                        <p className={cn("text-sm mb-5 leading-relaxed", attended || interested ? "text-gray-300" : "text-muted-foreground")}>
                            {event.description}
                        </p>

                        <button
                            onClick={() => handleInterestToggle(event.id)}
                            disabled={isLoading || attended}
                            className={cn(
                                "mt-auto w-full inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
                                buttonStyle
                            )}
                        >
                            {isLoading ? (
                                <span className="animate-spin mr-2">⏳</span> 
                            ) : attended ? (
                                <>
                                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                                    Asistencia Registrada
                                </>
                            ) : interested ? (
                                <>
                                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                                    {getInterestedLabel()}
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
