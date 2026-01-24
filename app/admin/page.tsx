import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { SearchBar } from "./search-bar"
import { AdminCheckIn } from "@/components/AdminCheckIn"
// ... imports
import { getEvents, getBeneficiaryReport, BeneficiaryReportItem } from "@/app/actions"
import { UsersIcon, QrCodeIcon, CalendarCheckIcon, CalendarIcon, ClipboardListIcon, ShieldIcon, FileBarChartIcon } from "lucide-react"
import { EventManagement } from "@/components/admin/EventManagement"
import { AdminUserActions } from "@/components/admin/AdminUserActions"
import { BeneficiaryReportTable } from "@/components/admin/BeneficiaryReportTable"
import { cn } from "@/lib/utils"

// Aseguramos que la página sea dinámica por la comprobación de cookies
export const dynamic = "force-dynamic"

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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; tab?: string }>
}) {
  // 1. Verificación de seguridad (Server-Side)
  const cookieStore = await cookies()
  const role = cookieStore.get("admin_role")?.value
  const legacySession = cookieStore.get("admin_session")?.value

  if (!role && legacySession !== "true") {
    redirect("/")
  }
  
  const currentRole = role || (legacySession === "true" ? "super_admin" : null);

  if (!currentRole) {
      redirect("/")
  }

  const isSuperAdmin = currentRole === 'super_admin';

  // 2. Obtener parámetros
  const params = await searchParams
  const query = params.query || ""
  const currentTab = params.tab || "database" // 'database' | 'checkin' | 'agenda' | 'report'

  // Refuse access to protected tabs if not super admin
  if ((currentTab === 'agenda' || currentTab === 'report') && !isSuperAdmin) {
      redirect("/admin?tab=database");
  }

  // 3. Preparar datos según la pestaña
  const supabase = await createClient()
  let profiles: Profile[] = []
  let events = []
  // @ts-ignore
  let reportData: { asistentes: BeneficiaryReportItem[], ponentes: BeneficiaryReportItem[] } = { asistentes: [], ponentes: [] }

  if (currentTab === 'database') {
      let supabaseQuery = supabase
        .from("profiles")
        .select(`
          *,
          event_attendance (
            is_interested,
            has_attended,
            events ( name )
          )
        `)
        .order("created_at", { ascending: false })

      if (query) {
        supabaseQuery = supabaseQuery.or(`short_id.ilike.%${query}%,nombre.ilike.%${query}%,apellido.ilike.%${query}%`)
      }

      const { data, error } = await supabaseQuery
      if (!error && data) {
          // @ts-ignore
          profiles = data
      }
  } else if (currentTab === 'checkin') {
      events = await getEvents()
  } else if (currentTab === 'agenda' && isSuperAdmin) {
      events = await getEvents()
  } else if (currentTab === 'report' && isSuperAdmin) {
      const result = await getBeneficiaryReport()
      if (result.success && result.data) {
          reportData = result.data
      }
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans">
      <div className="mx-auto max-w-[90rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Panel de Administración
                </h1>
                <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    isSuperAdmin 
                        ? "bg-purple-50 text-purple-700 border-purple-200" 
                        : "bg-blue-50 text-blue-700 border-blue-200"
                )}>
                    {isSuperAdmin ? "Super Admin" : "Staff"}
                </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Sistema de gestión centralizada.
            </p>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-1 rounded-xl bg-gray-200/50 p-1 mb-8 w-full md:w-fit overflow-x-auto whitespace-nowrap">
            <Link
                href="/admin?tab=database"
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 flex-1 md:flex-none",
                    currentTab === 'database' 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
            >
                <UsersIcon className="h-4 w-4" />
                Base de Datos
            </Link>
            
            {isSuperAdmin && (
                <>
                <Link
                    href="/admin?tab=agenda"
                    className={cn(
                        "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 flex-1 md:flex-none",
                        currentTab === 'agenda' 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                    )}
                >
                    <ClipboardListIcon className="h-4 w-4" />
                    Gestión de Agenda
                </Link>
                <Link
                    href="/admin?tab=report"
                    className={cn(
                        "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 flex-1 md:flex-none",
                        currentTab === 'report' 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                    )}
                >
                    <FileBarChartIcon className="h-4 w-4" />
                    SIGECO
                </Link>
                </>
            )}

            <Link
                href="/admin?tab=checkin"
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 flex-1 md:flex-none",
                    currentTab === 'checkin' 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
            >
                <QrCodeIcon className="h-4 w-4" />
                Escáner de Asistencia
            </Link>
        </div>


        {/* Content Area */}
        {currentTab === 'agenda' && isSuperAdmin ? (
            // @ts-ignore
            <EventManagement initialEvents={events} />
        ) : currentTab === 'report' && isSuperAdmin ? (
             <BeneficiaryReportTable asistentes={reportData.asistentes} ponentes={reportData.ponentes} />
        ) : currentTab === 'checkin' ? (
             <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Validación de Asistencia</h2>
                    <p className="text-muted-foreground text-sm">Escanea el código QR de los asistentes o ingrésalo manualmente.</p>
                </div>
                {/* @ts-ignore */}
                <AdminCheckIn events={events}/>
             </div>
        ) : (
             <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                     <div>
                        <h2 className="text-xl font-semibold mb-2">Registro de Usuarios</h2>
                        <p className="text-muted-foreground text-sm">Perfiles registrados en la plataforma.</p>
                     </div>
                     <div className="w-full md:w-96">
                        <SearchBar />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-center text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                            <tr>
                            <th scope="col" className="px-4 py-3 md:px-6 md:py-4 font-semibold text-left">Acciones</th>
                            <th scope="col" className="px-4 py-3 md:px-6 md:py-4 font-semibold text-left whitespace-nowrap">ID</th>
                            <th scope="col" className="px-4 py-3 md:px-6 md:py-4 font-semibold text-left">Participante</th>
                            <th scope="col" className="px-4 py-3 md:px-6 md:py-4 font-semibold text-left hidden lg:table-cell">Rol</th>
                            <th scope="col" className="px-4 py-3 md:px-6 md:py-4 font-semibold text-left hidden md:table-cell">Contacto</th>
                            <th scope="col" className="px-4 py-3 md:px-6 md:py-4 font-semibold text-left w-1/4 hidden lg:table-cell">Eventos / Intereses</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                             {profiles.map((profile: Profile, index) => (
                            <tr
                                key={profile.id}
                                className={`
                                hover:bg-gray-50 transition-colors
                                ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                                `}
                            >
                                <td className="px-4 py-3 md:px-6 md:py-4 align-top">
                                    <AdminUserActions shortId={profile.short_id} nombre={profile.nombre} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 md:px-6 md:py-4 font-medium text-gray-900 align-top">
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {profile.short_id}
                                </span>
                                <div className="text-[10px] text-muted-foreground mt-1 lg:hidden">
                                     {new Date(profile.created_at).toLocaleDateString("es-MX", { day: 'numeric', month: 'short' })}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1 hidden lg:block">
                                    {new Date(profile.created_at).toLocaleDateString("es-MX", { day: 'numeric', month: 'short' })}
                                </div>
                                </td>
                                <td className="px-4 py-3 md:px-6 md:py-4 text-gray-900 align-top">
                                   <div className="font-medium">{profile.nombre} {profile.apellido}</div>
                                   <div className="text-xs text-muted-foreground mt-0.5 md:hidden">{profile.grado} • {profile.participacion || 'Asistente'}</div>
                                   <div className="text-xs text-muted-foreground mt-0.5 hidden md:block lg:hidden">{profile.grado}</div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 md:px-6 md:py-4 align-top hidden lg:table-cell">
                                    <span className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                                        profile.participacion === 'Ponente' 
                                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    )}>
                                        {profile.participacion || 'Asistente'}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 md:px-6 md:py-4 font-mono text-xs align-top hidden md:table-cell">
                                  <div className="flex flex-col gap-1">
                                    <span>{profile.correo}</span>
                                    <span className="text-muted-foreground">{profile.telefono}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 md:px-6 md:py-4 align-top hidden lg:table-cell">
                                    <div className="flex flex-col gap-2">
                                        {profile.event_attendance && profile.event_attendance.length > 0 ? (
                                            profile.event_attendance.map((record, idx) => (
                                                <div key={idx} className="flex items-start gap-2 text-xs">
                                                    {record.has_attended ? (
                                                        <CalendarCheckIcon className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                                                    ) : (
                                                        <CalendarIcon className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                                                    )}
                                                    <span className={cn(
                                                        record.has_attended ? "text-green-700 font-medium" : "text-gray-600"
                                                    )}>
                                                        {record?.events?.name}
                                                        {record.has_attended && " (Asistió)"}
                                                        {!record.has_attended && record.is_interested && " (Interesado)"}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Sin actividad registrada</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            ))}
                            
                            {profiles.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                <div className="flex flex-col items-center justify-center p-4">
                                    <p className="font-semibold text-gray-900">No se encontraron resultados</p>
                                    <p className="mt-1">
                                        {query ? "Intenta con otro término de búsqueda." : "No hay registros en la base de datos."}
                                    </p>
                                </div>
                                </td>
                            </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                
                     <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-xs text-gray-500 flex justify-between">
                        <span>Total de registros: {profiles.length}</span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </main>
  )
}

