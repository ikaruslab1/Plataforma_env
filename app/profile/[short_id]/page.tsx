import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getDegreeAbbr, GradoAcademico, Genero, cn } from "@/lib/utils"
import { ProfileCard } from "@/components/feature/ProfileCard"
import { getEvents, getUserAttendance } from "@/app/actions"
import { EventAgenda } from "@/components/feature/EventAgenda"
import { IdCardIcon, CalendarCheckIcon } from "lucide-react"

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

  const abbr = getDegreeAbbr(profile.grado as GradoAcademico, profile.genero as Genero)
  const fullName = `${profile.nombre} ${profile.apellido}`
  const displayName = `${abbr} ${fullName}`
  const qrData = `${fullName} | ${profile.grado} | ${profile.short_id}`

  const events = await getEvents()
  // @ts-ignore
  const attendance = await getUserAttendance(short_id)

  return (
    <main className="min-h-screen flex flex-col items-center pt-8 md:pt-12 p-4 bg-muted/20 font-sans">
        
        {/* Tabs Navigation */}
        <div className="flex space-x-1 rounded-xl bg-gray-200/50 p-1 mb-8 w-full max-w-md overflow-x-auto whitespace-nowrap shadow-sm">
            <Link
                href={`/profile/${short_id}?tab=gafete`}
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 flex-1",
                    currentTab === 'gafete' 
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
                scroll={false}
            >
                <IdCardIcon className="h-4 w-4" />
                Mi Gafete
            </Link>
            <Link
                href={`/profile/${short_id}?tab=agenda`}
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 flex-1",
                    currentTab === 'agenda' 
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
                scroll={false}
            >
                <CalendarCheckIcon className="h-4 w-4" />
                Agenda
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

