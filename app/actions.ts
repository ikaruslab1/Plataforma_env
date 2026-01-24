"use server"

import { z } from "zod"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { generateShortId, GradoAcademico, getDegreeAbbr, Genero } from "@/lib/utils"
import { cookies } from "next/headers"

const registerSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(2, "Mínimo 2 caracteres"),
  grado: z.enum(['Doctorado', 'Maestría', 'Licenciatura', 'Estudiante']),
  genero: z.enum(['Masculino', 'Femenino', 'Neutro']),
  curp: z.string().length(18, "La CURP debe tener 18 caracteres").toUpperCase(), // Simplified regex for now or standard
  participacion: z.enum(['Ponente', 'Asistente']),
  correo: z.string().email("Correo inválido"),
  confirmarCorreo: z.string().email(),
  telefono: z.string().min(10, "Mínimo 10 dígitos"),
}).refine((data) => data.correo === data.confirmarCorreo, {
  message: "Los correos no coinciden",
  path: ["confirmarCorreo"],
});

export type FormState = {
  success?: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  data?: { short_id: string; nombre: string; apellido: string };
  curpRegistered?: boolean;
};


function formatName(name: string): string {
  const lowercaseExceptions = ['de', 'la', 'del', 'los', 'das', 'dos', 'da', 'e', 'y'];
  return name.trim().toLowerCase().split(/\s+/).map((word, index) => {
    if (index > 0 && lowercaseExceptions.includes(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

export async function registerUser(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  
  // Data cleaning
  rawData.curp = (rawData.curp as string).toUpperCase();

  // Zod validation
  const validatedFields = registerSchema.safeParse(rawData);
  
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error de validación. Revisa los campos.",
    };
  }

  let { nombre, apellido, grado, genero, curp, correo, telefono, participacion } = validatedFields.data;

  // Formatting strings
  nombre = formatName(nombre);
  apellido = formatName(apellido);
  
  const supabase = await createClient();
  
  // Check if CURP is already registered
  const { data: existingCurp } = await supabase.from('profiles').select('short_id').eq('curp', rawData.curp).single();
  
  if (existingCurp) {
      return { 
          success: false, 
          curpRegistered: true, 
          message: "La CURP ya se encuentra registrada. Serás redirigido a la recuperación de cuenta." 
      };
  }

  // Generate ID
  let short_id = generateShortId(grado as GradoAcademico);
  let attempts = 0;
  
  // Simple collision check loop (max 3 tries)
  while (attempts < 3) {
      const { data } = await supabase.from('profiles').select('short_id').eq('short_id', short_id).single();
      if (!data) break; // Unique
      short_id = generateShortId(grado as GradoAcademico);
      attempts++;
  }
  
  const { error } = await supabase.from('profiles').insert({
    short_id,
    nombre,
    apellido,
    grado,
    genero,
    participacion,
    curp,
    correo,
    telefono
  });

  if (error) {
    console.error("Supabase Error:", error);
    if (error.code === '23505') { // Unique violation
       return { success: false, message: "La CURP ya está registrada." };
    }
    return { success: false, message: "Error al registrar en base de datos. Intente de nuevo." };
  }

  return { 
    success: true, 
    data: { short_id, nombre, apellido },
    message: "Registro exitoso." 
  };
}

export async function verifyUser(formData: FormData) {
  const raw_id = formData.get('short_id') as string;
  const short_id = raw_id ? raw_id.trim().toUpperCase() : '';
  
  if(!short_id) return { error: "Ingresa un ID válido." };

  const cookieStore = await cookies();

  // 1. ROL "STAFF" (Nivel 1)
  if (short_id === "STAFF-0000") {
    cookieStore.set("admin_role", "staff", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });
    return { success: true, redirectUrl: "/admin" };
  }

  // 2. ROL "UIM-II ADMINI" (Nivel 2 - Super Admin)
  if (short_id === "UIM-2222") {
    cookieStore.set("admin_role", "super_admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });
    return { success: true, redirectUrl: "/admin" };
  }
  
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('short_id').eq('short_id', short_id).single();
  
  if (error || !data) {
    return { error: "ID no encontrado en el sistema." };
  }
  
  // We return the path to redirect to, handled by client to avoid 'NEXT_REDIRECT' error in try/catch blocks if any
  return { success: true, redirectUrl: `/profile/${data.short_id}` };
}

// --- Event Actions ---

export async function getEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }
  return data;
}

const eventSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  event_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha inválida",
  }),
});

export async function createEvent(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const role = cookieStore.get("admin_role")?.value;

  if (role !== "super_admin") {
    return { success: false, message: "No tienes permisos para realizar esta acción." };
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    event_date: formData.get("event_date"),
  };

  const validatedFields = eventSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos inválidos.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("events").insert({
    name: validatedFields.data.name,
    description: validatedFields.data.description,
    event_date: validatedFields.data.event_date,
  });

  if (error) {
    console.error("Create Event Error:", error);
    return { success: false, message: "Error al crear el evento." };
  }

  return { success: true, message: "Evento creado exitosamente." };
}

export async function updateEvent(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const role = cookieStore.get("admin_role")?.value;

  if (role !== "super_admin") {
    return { success: false, message: "No tienes permisos para realizar esta acción." };
  }

  const id = formData.get("id") as string;
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    event_date: formData.get("event_date"),
  };

  const validatedFields = eventSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos inválidos.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({
      name: validatedFields.data.name,
      description: validatedFields.data.description,
      event_date: validatedFields.data.event_date,
    })
    .eq("id", id);

  if (error) {
    console.error("Update Event Error:", error);
    return { success: false, message: "Error al actualizar el evento." };
  }

  return { success: true, message: "Evento actualizado exitosamente." };
}

export async function deleteEvent(formData: FormData) {
  const cookieStore = await cookies();
  const role = cookieStore.get("admin_role")?.value;

  if (role !== "super_admin") {
    return { success: false, message: "No tienes permisos para realizar esta acción." };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, message: "ID de evento requerido." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    console.error("Delete Event Error:", error);
    return { success: false, message: "Error al eliminar el evento." };
  }

  return { success: true, message: "Evento eliminado." };
}

export async function getUserAttendance(short_id: string) {
  const supabase = await createClient();
  
  // First get profile_id
  const { data: profile } = await supabase.from('profiles').select('id').eq('short_id', short_id).single();
  if (!profile) return [];

  return getUserAttendanceById(profile.id);
}

export async function getUserAttendanceById(profile_id: string) {
  const supabase = await createClient();
  const { data: attendance, error } = await supabase
    .from('event_attendance')
    .select('event_id, is_interested, has_attended')
    .eq('profile_id', profile_id);

  if (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
  return attendance;
}

export async function toggleEventInterest(short_id: string, event_id: string) {
  const supabase = await createClient();
  
  // Get profile
  const { data: profile } = await supabase.from('profiles').select('id').eq('short_id', short_id).single();
  if (!profile) return { success: false, message: "Usuario no encontrado" };

  // Check existing record
  const { data: existing } = await supabase
    .from('event_attendance')
    .select('is_interested')
    .eq('profile_id', profile.id)
    .eq('event_id', event_id)
    .single();

  if (existing) {
    // Toggle
    const { error } = await supabase
      .from('event_attendance')
      .update({ is_interested: !existing.is_interested })
      .eq('profile_id', profile.id)
      .eq('event_id', event_id);
      
    if (error) return { success: false, message: "Error al actualizar" };
  } else {
    // Insert
    const { error } = await supabase
      .from('event_attendance')
      .insert({ profile_id: profile.id, event_id: event_id, is_interested: true });
      
    if (error) return { success: false, message: "Error al crear registro" };
  }

  return { success: true };
}

export async function confirmEventAttendanceAction(short_id: string, event_id: string) {
  const supabase = await createClient();

  // Get profile and name for feedback
  const { data: profile } = await supabase.from('profiles').select('id, nombre, apellido').eq('short_id', short_id).single();
  if (!profile) return { success: false, message: "Usuario no encontrado" };

  // Upsert to ensure record exists and set has_attended to true
  // We use upsert to handle both existing and new records (e.g. user didn't click "interested" but showed up)
  const { error } = await supabase
    .from('event_attendance')
    .upsert({ 
      profile_id: profile.id, 
      event_id: event_id, 
      has_attended: true 
    }, { onConflict: 'profile_id, event_id' })
    .select();

  if (error) {
    console.error("Attendance Error", error);
    return { success: false, message: "Error al registrar asistencia" };
  }

  return { success: true, message: `Asistencia registrada para ${profile.nombre} ${profile.apellido}` };
}

// --- Account Recovery ---

export async function recoverAccountByCurp(query: string) {
  const supabase = await createClient();
  const cleanQuery = query.trim().toUpperCase();

  if (cleanQuery.length < 4) {
      return { success: false, message: "Ingresa al menos 4 caracteres." };
  }

  // Use ILIKE for case-insensitive matching allowing the query to be at the start
  const { data, error } = await supabase
    .from('profiles')
    .select('short_id, nombre, apellido, curp, grado')
    .ilike('curp', `${cleanQuery}%`)
    .limit(5);

  if (error) {
    console.error("Recovery Error:", error);
    return { success: false, message: "Error al buscar en la base de datos." };
  }

  if (!data || data.length === 0) {
    return { success: false, message: "No se encontraron registros con esa información." };
  }

  if (data.length > 1) {
     return { 
         success: false, 
         message: `Encontramos ${data.length} coincidencias. Por favor ingresa más caracteres de tu CURP.` 
     };
  }

  return { success: true, user: data[0] };
}

// --- Reports ---

export type BeneficiaryReportItem = {
  nombre: string
  apellidos: string
  curp: string
  codigo_identidad: string
  correo_electronico: string
  correo_alterno: string
  nivel_estudios: string
  fecha_inicio: string
  fecha_termino: string
  calificacion: string
  nacionalidad: string
  genero: string
  fecha_nacimiento: string
}

export async function getBeneficiaryReport(): Promise<{ success: boolean; data?: { asistentes: BeneficiaryReportItem[], ponentes: BeneficiaryReportItem[] }; message?: string }> {
  const cookieStore = await cookies()
  const role = cookieStore.get("admin_role")?.value

  if (role !== "super_admin") {
      return { success: false, message: "No tienes permisos." }
  }

  const supabase = await createClient()

  // 1. Get Totals and Threshold
  const { count: totalEvents, error: eventsError } = await supabase.from('events').select('*', { count: 'exact', head: true })
  
  if (eventsError || totalEvents === null) {
      console.error("Error fetching events count", eventsError)
      return { success: false, message: "Error al calcular eventos." }
  }

  const requiredThreshold = Math.ceil(totalEvents * 0.70)

  // 2. Get Profiles with Attendance
  // We need to fetch profiles and their attendance records that have attended = true
  // And we need the event date for those records
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      *,
      event_attendance!inner (
        event_id,
        has_attended,
        events ( event_date )
      )
    `)
    .eq('event_attendance.has_attended', true)

  if (profilesError) {
      console.error("Error fetching profiles report", profilesError)
      return { success: false, message: "Error al obtener datos." }
  }

  // 3. Process and Filter
  const asistentes: BeneficiaryReportItem[] = []
  const ponentes: BeneficiaryReportItem[] = []

  for (const profile of profiles) {
    // Check threshold
    // validAttendance is implicit because we used !inner join with filter has_attended=true
    // However, the query returns users who have AT LEAST ONE attendance. 
    // We must count the actual array length returned.
    
    // @ts-ignore
    const attendanceRecords = profile.event_attendance || []
    
    if (attendanceRecords.length >= requiredThreshold) {
        
        // Calculate dates
        // Extract dates, sort asc
        // @ts-ignore
        const dates = attendanceRecords.map(r => new Date(r.events.event_date).getTime()).sort((a, b) => a - b)
        
        let formattedDate = ""
        if (dates.length > 0) {
            const firstDate = new Date(dates[0])
            // Format dd-mm-aa
            const day = String(firstDate.getDate()).padStart(2, '0')
            const month = String(firstDate.getMonth() + 1).padStart(2, '0')
            const year = String(firstDate.getFullYear()).slice(-2)
            formattedDate = `${day}-${month}-${year}`
        }

        // Helper for Name
        const abbr = getDegreeAbbr(profile.grado as GradoAcademico, profile.genero as Genero)
        // Rule: "Estudiante" -> SOLO Nombre. Others -> Abbr + Nombre.
        const finalNombre = profile.grado === 'Estudiante' ? profile.nombre : `${abbr} ${profile.nombre}`

        const item: BeneficiaryReportItem = {
            nombre: finalNombre,
            apellidos: profile.apellido,
            curp: profile.curp || "",
            codigo_identidad: "",
            correo_electronico: profile.correo,
            correo_alterno: profile.correo,
            nivel_estudios: profile.grado,
            fecha_inicio: formattedDate,
            fecha_termino: formattedDate, // Requested to repeat same date
            calificacion: "",
            nacionalidad: "",
            genero: profile.genero,
            fecha_nacimiento: ""
        }

        if (profile.participacion === 'Ponente') {
            ponentes.push(item)
        } else {
            asistentes.push(item)
        }
    }
  }
  
  return { success: true, data: { asistentes, ponentes } }
}
