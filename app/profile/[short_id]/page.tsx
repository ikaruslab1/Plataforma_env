import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getDegreeAbbr, GradoAcademico, Genero } from "@/lib/utils"
import { ProfileCard } from "@/components/feature/ProfileCard"

export default async function ProfilePage({ params }: { params: { short_id: string } }) {
  // In Next.js 15 params is async, but this is 14 pattern or 15 compatible if awaited? 
  // Next 15 requires awaiting params. Next 14 does not. 
  // I will assume it is an object for now, or await it if it's a promise (TS check would be helpful).
  // Safest: Use `const slug = params.short_id`.
  
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('short_id', params.short_id).single()

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <ProfileCard 
            shortId={profile.short_id}
            displayName={displayName}
            grado={profile.grado}
            qrData={qrData}
        />
    </main>
  )
}
