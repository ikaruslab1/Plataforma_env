import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getDegreeAbbr, GradoAcademico, Genero } from "@/lib/utils"
import { ProfileCard } from "@/components/feature/ProfileCard"
import { getEvents, getUserAttendance } from "@/app/actions"
import { EventAgenda } from "@/components/feature/EventAgenda"

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
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <ProfileCard 
            shortId={profile.short_id}
            displayName={displayName}
            grado={profile.grado}
            qrData={qrData}
            isNewUser={isNewUser}
            participacion={profile.participacion}
        />
        
        {/* Agenda de Eventos */}
        <EventAgenda 
            // @ts-ignore
            events={events} 
            // @ts-ignore
            initialAttendance={attendance} 
            shortId={profile.short_id} 
        />
    </main>
  )
}
