import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SearchBar } from "./search-bar"

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
  created_at: string
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  // 1. Verificación de seguridad (Server-Side)
  // En Next.js 15+, cookies() devuelve una Promesa
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get("admin_session")?.value === "true"

  if (!isAdmin) {
    redirect("/")
  }

  // 2. Obtener parámetros de búsqueda
  const params = await searchParams
  const query = params.query || ""

  // 3. Consultar datos
  const supabase = await createClient()
  
  // Consulta base
  let supabaseQuery = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  // Aplicar filtro si existe búsqueda
  if (query) {
    supabaseQuery = supabaseQuery.or(`short_id.ilike.%${query}%,nombre.ilike.%${query}%,apellido.ilike.%${query}%`)
  }

  const { data: profiles, error } = await supabaseQuery

  if (error) {
    console.error("Error al obtener perfiles:", error)
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error al cargar los datos. Por favor intente más tarde.
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans">
      <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Panel de Administración
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Visualización y gestión de registros de la plataforma.
            </p>
          </div>
          <div className="w-full md:w-96">
            <SearchBar />
          </div>
        </header>

        {/* Table Container */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">ID Corto</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Nombre Completo</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Grado</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Género</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Correo</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Teléfono</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles?.map((profile: Profile, index) => (
                  <tr
                    key={profile.id}
                    className={`
                      hover:bg-gray-50 transition-colors
                      ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                    `}
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {profile.short_id}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-900">
                       {profile.nombre} {profile.apellido}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`
                        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${profile.grado === 'Doctorado' ? 'bg-purple-100 text-purple-800' : 
                          profile.grado === 'Maestría' ? 'bg-indigo-100 text-indigo-800' :
                          profile.grado === 'Licenciatura' ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-800'}
                      `}>
                        {profile.grado}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {profile.genero}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">
                      {profile.correo}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">
                      {profile.telefono}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(profile.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))}
                
                {(!profiles || profiles.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center justify-center p-4">
                        <p className="font-semibold text-gray-900">No se encontraron resultados</p>
                        <p className="mt-1">Intenta con otro término de búsqueda.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-xs text-gray-500 flex justify-between">
             <span>Total de registros: {profiles?.length || 0}</span>
          </div>
        </div>
      </div>
    </main>
  )
}
