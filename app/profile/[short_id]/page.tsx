import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getDegreeAbbr, GradoAcademico, Genero, cn } from "@/lib/utils"
import { ProfileCard } from "@/components/feature/ProfileCard"
import { getEvents, getUserAttendanceById } from "@/app/actions"
import { EventAgenda } from "@/components/feature/EventAgenda"
import { IdCardIcon, CalendarCheckIcon, AwardIcon, CheckCircle2 } from "lucide-react"
import { Metadata } from "next"

export async function generateMetadata({ 
  params,
}: { 
  params: Promise<{ short_id: string }> 
}): Promise<Metadata> {
  const { short_id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('nombre, apellido, grado').eq('short_id', short_id).single()

  if (!profile) {
    return {
      title: 'Perfil No Encontrado',
    }
  }

  return {
    title: `${profile.nombre} ${profile.apellido} | Perfil Académico`,
    description: `Consulta el perfil académico de ${profile.nombre} ${profile.apellido}`,
  }
}

export default async function ProfilePage({ 
  params,
  searchParams, 
}: { 
  params: Promise<{ short_id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { short_id } = await params
  const resolvedSearchParams = await searchParams
  const isNewUser = resolvedSearchParams.welcome === 'true'
  const currentTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'gafete'
  
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('short_id', short_id).single()

  if (!profile) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-muted-foreground mb-8">Perfil no encontrado.</p>
            <a href="/" className="text-primary hover:underline">Volver al inicio</a>
        </div>
    )
  }

  // Parallel data fetching
  const [events, attendance] = await Promise.all([
    getEvents(),
    getUserAttendanceById(profile.id)
  ])

  const abbr = getDegreeAbbr(profile.grado as GradoAcademico, profile.genero as Genero)
  const fullName = `${profile.nombre} ${profile.apellido}`
  const displayName = `${abbr} ${fullName}`
  const qrData = `${fullName} | ${profile.grado} | ${profile.short_id}`

  // Logic for Constancia
  const totalEvents = events ? events.length : 0
  // @ts-ignore
  const attendedCount = attendance ? attendance.filter(a => a.has_attended).length : 0
  const requiredEvents = Math.ceil(totalEvents * 0.70)
  const isQualified = attendedCount >= requiredEvents
  // Avoid division by zero
  const progressPercentage = requiredEvents > 0 
    ? Math.min(100, Math.round((attendedCount / requiredEvents) * 100)) 
    : 0
  const missingEvents = Math.max(0, requiredEvents - attendedCount)

  return (
    <main className="min-h-screen flex flex-col items-center pt-8 md:pt-12 p-4 bg-muted/20 font-sans">
        
        {/* Tabs Navigation */}
        <div className="flex space-x-1 rounded-xl bg-gray-200/50 p-1 mb-8 w-full max-w-md overflow-x-auto whitespace-nowrap shadow-sm scrollbar-hide">
            <Link
                href={`/profile/${short_id}?tab=gafete`}
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 flex-1",
                    currentTab === 'gafete' 
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
                scroll={false}
            >
                <IdCardIcon className="h-4 w-4" />
                No. Gafete
            </Link>
            <Link
                href={`/profile/${short_id}?tab=agenda`}
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 flex-1",
                    currentTab === 'agenda' 
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
                scroll={false}
            >
                <CalendarCheckIcon className="h-4 w-4" />
                Agenda
            </Link>
            <Link
                href={`/profile/${short_id}?tab=constancia`}
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 flex-1",
                    currentTab === 'constancia' 
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
                scroll={false}
            >
                <AwardIcon className="h-4 w-4" />
                Constancia
            </Link>
        </div>

        <div className="w-full max-w-md">
            {currentTab === 'agenda' ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                     <EventAgenda 
                        // @ts-ignore
                        events={events} 
                        // @ts-ignore
                        initialAttendance={attendance} 
                        shortId={profile.short_id}
                        userGender={profile.genero}
                    />
                </div>
            ) : currentTab === 'constancia' ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-6">
                            
                            {isQualified ? (
                                // STATE B: QUALIFIED
                                <>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-pulse opacity-50"></div>
                                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center relative z-10 shadow-sm">
                                            <AwardIcon className="h-10 w-10" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-gray-900">¡Felicidades!</h2>
                                        <p className="text-gray-600 font-medium text-lg">Has cumplido con la asistencia requerida.</p>
                                    </div>

                                    <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-sm text-blue-900 font-medium">Procesando constancia digital</p>
                                                <p className="text-xs text-blue-700 leading-relaxed">
                                                    Tu documento oficial está siendo generado y será enviado automáticamente a tu correo.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-px bg-blue-200 w-full"></div>
                                     
                                        <p className="text-xs text-blue-800 py-2 text-center">
                                            Correo registrado: <span className="font-bold">{profile.correo}</span>
                                            <br />
                                            <span className="opacity-75">Si es incorrecto, contacta al Staff inmediatamente.</span>
                                        </p>
                                    </div>
                                </>
                            ) : (
                                // STATE A: NOT QUALIFIED
                                <>
                                    <div className="space-y-2 w-full">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-semibold text-gray-700">Progreso de Asistencia</span>
                                            <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
                                        </div>
                                        
                                        {/* Progress Bar Container */}
                                        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Inicio</span>
                                            <span>Objetivo: {requiredEvents} eventos</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Asistidos</p>
                                            <p className="text-3xl font-bold text-gray-900">{attendedCount}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Requeridos</p>
                                            <p className="text-3xl font-bold text-gray-900 opacity-60">{requiredEvents}</p>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 w-full flex items-start gap-3 text-left">
                                        <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                                            <CalendarCheckIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-orange-900 font-medium">Sigue participando</p>
                                            <p className="text-xs text-orange-700 mt-0.5">
                                                Te faltan asistir a <span className="font-bold">{missingEvents}</span> evento{missingEvents !== 1 ? 's' : ''} más para liberar tu constancia.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <ProfileCard 
                        shortId={profile.short_id}
                        displayName={displayName}
                        grado={profile.grado}
                        qrData={qrData}
                        isNewUser={isNewUser}
                        participacion={profile.participacion}
                    />
                </div>
            )}
        </div>
    </main>
  )
}

