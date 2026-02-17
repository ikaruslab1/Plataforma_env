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
  participacion: z.enum(['Ponente', 'Asistente']),
  correo: z.string().email("Correo inválido"),
  confirmarCorreo: z.string().email(),
  telefono: z.string().min(10, "Mínimo 10 dígitos"),
  
  // Optional fields for flexvalidation
  curp: z.string().optional(),
  noCurp: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  nacionalidad: z.string().optional(),
  codigo_identidad: z.string().optional(),
}).superRefine((data, ctx) => {
  // Email validation
  if (data.correo !== data.confirmarCorreo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Los correos no coinciden",
      path: ["confirmarCorreo"],
    });
  }

  // Identity logic:
  // Must have CURP, OR (Identity Code), OR (Date of Birth AND Nationality)
  const hasCurp = data.curp && data.curp.length === 18;
  const hasPassport = data.codigo_identidad && data.codigo_identidad.length >= 3;
  const hasBio = data.fecha_nacimiento && data.nacionalidad;

  if (!hasCurp && !hasPassport && !hasBio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes ingresar tu CURP, o tu Código de Identidad (Pasaporte), o tu Fecha de Nacimiento y Nacionalidad.",
        path: ["curp"], // Attach error to curp or general
      });
      // Also potentially attach to other fields for UI highlighting
      if (data.noCurp === 'true') {
         if (!hasPassport) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido si no tiene CURP", path: ["codigo_identidad"] });
         if (!hasBio) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido si no tiene Pasaporte", path: ["fecha_nacimiento"] });
      }
  }

  // Validate specific formats if provided
  if (data.curp && data.curp.length > 0 && data.curp.length !== 18) {
      ctx.addIssue({
         code: z.ZodIssueCode.custom,
         message: "La CURP debe tener 18 caracteres",
         path: ["curp"],
       });
  }
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
  if (rawData.curp) {
      rawData.curp = (rawData.curp as string).toUpperCase();
  }

  // Zod validation
  const validatedFields = registerSchema.safeParse(rawData);
  
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error de validación. Revisa los campos requeridos.",
    };
  }

  let { nombre, apellido, grado, genero, curp, correo, telefono, participacion, noCurp, fecha_nacimiento, nacionalidad, codigo_identidad } = validatedFields.data;

  // Formatting strings
  nombre = formatName(nombre);
  apellido = formatName(apellido);
  
  const supabase = await createClient();
  
  // Check existence
  // 1. Check CURP if provided
  if (curp && curp.length === 18) {
      const { data: existingCurp } = await supabase.from('profiles').select('short_id').eq('curp', curp).single();
      if (existingCurp) {
          return { success: false, curpRegistered: true, message: "La CURP ya se encuentra registrada." };
      }
  }
  
  // 2. Check Identity Code if provided
  if (codigo_identidad && codigo_identidad.length >= 3) {
      const { data: existingPassport } = await supabase.from('profiles').select('short_id').eq('codigo_identidad', codigo_identidad).single();
      if (existingPassport) {
          return { success: false, curpRegistered: true, message: "El código de identidad ya se encuentra registrado." };
      }
  }

  // 3. Optional: Check DOB + Name + Nationality? 
  // For now, we assume this combination might not be unique enough or we skip it to avoid false positives 
  // unless strictly requested. The Prompt didn't explicitly ask for duplicates check on this, just logic to allow sending.

  // Generate ID
  let short_id = generateShortId(grado as GradoAcademico);
  let attempts = 0;
  
  while (attempts < 3) {
      const { data } = await supabase.from('profiles').select('short_id').eq('short_id', short_id).single();
      if (!data) break; // Unique
      short_id = generateShortId(grado as GradoAcademico);
      attempts++;
  }
  
  const dbData: any = {
    short_id,
    nombre,
    apellido,
    grado,
    genero,
    participacion,
    correo,
    telefono,
    // Add conditional fields
    curp: (curp && curp.length === 18) ? curp : null,
    codigo_identidad: codigo_identidad || null,
    fecha_nacimiento: fecha_nacimiento || null,
    nacionalidad: nacionalidad || null 
  };
  
  const { error } = await supabase.from('profiles').insert(dbData);

  if (error) {
    console.error("Supabase Error:", error);
    if (error.code === '23505') { // Unique violation
       return { success: false, message: "El usuario ya está registrado." };
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
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Unexpected error in getEvents:", error);
    return [];
  }
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
  try {
    const supabase = await createClient();
    const { data: attendance, error } = await supabase
      .from('event_attendance')
      .select('event_id, is_interested, has_attended')
      .eq('profile_id', profile_id);

  if (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
  return attendance || [];
} catch (error) {
  console.error("Unexpected error in getUserAttendanceById:", error);
  return [];
}
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

export async function recoverAccountByIdentityCode(query: string) {
  const supabase = createClient();
  const cleanQuery = query.trim();

  if (cleanQuery.length < 3) {
      return { success: false, message: "Ingresa al menos 3 caracteres." };
  }

  const { data, error } = await (await supabase)
      .from('profiles')
      .select('short_id, nombre, apellido, grado, codigo_identidad')
      .ilike('codigo_identidad', `${cleanQuery}%`) // Search by prefix too
      .limit(5);

  if (error) {
      console.error("Identity Recovery Error:", error);
      return { success: false, message: "Error al buscar." };
  }

  if (!data || data.length === 0) {
      return { success: false, message: "No se encontró ningún registro con este código." };
  }

  if (data.length > 1) {
       return { success: false, message: `Múltiples coincidencias (${data.length}). Sé más específico.` };
  }

  return { success: true, user: data[0] };
}

export async function recoverAccountByBio(fecha_nacimiento: string, grado: string, nacionalidad: string) {
    const supabase = await createClient();
    
    // We expect exact matches here for security/precision as these are common fields
    let query = supabase
        .from('profiles')
        .select('short_id, nombre, apellido, grado')
        .eq('fecha_nacimiento', fecha_nacimiento)
        .eq('grado', grado);

    if (nacionalidad) {
        query = query.ilike('nacionalidad', nacionalidad);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error("Bio Recovery Error:", error);
        return { success: false, message: "Error al buscar." };
    }

    if (!data || data.length === 0) {
        return { success: false, message: "No se encontraron registros con estos datos." };
    }
    
    if (data.length > 1) {
        // If duplicates (twins with same degree?), we can't easily distinguish. 
        // Ideally we'd ask for name, but instructions said DOB + Grade (and implicitly Nationality based on context).
        return { success: false, message: "Múltiples registros encontrados. Contacta a soporte." };
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

  const supabase = createAdminClient()

  // 1. Get Totals and Threshold
  const requiredThreshold = 3

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

        // Format DOB if exists
        let formattedDob = ""
        if(profile.fecha_nacimiento){
             const dobDate = new Date(profile.fecha_nacimiento)
             const dobDay = String(dobDate.getDate() + 1).padStart(2, '0') // Fix timezone offset or use UTC if needed, usually simple dates might be tricky. Assuming string "YYYY-MM-DD" parsing
             // Actually, if it's "YYYY-MM-DD", splitting is safer to avoid timezone issues:
             const [y, m, d] = profile.fecha_nacimiento.split('-')
             if(y && m && d) formattedDob = `${d}-${m}-${y.slice(-2)}`
        }

        // Gender Logic: Show only if Nationality exists
        const showGender = (profile.nacionalidad) ? profile.genero : ""

        const item: BeneficiaryReportItem = {
            nombre: finalNombre,
            apellidos: profile.apellido,
            curp: profile.curp || "",
            codigo_identidad: profile.codigo_identidad || "",
            correo_electronico: profile.correo,
            correo_alterno: profile.correo,
            nivel_estudios: profile.grado,
            fecha_inicio: formattedDate,
            fecha_termino: formattedDate, // Requested to repeat same date
            calificacion: "",
            nacionalidad: profile.nacionalidad || "",
            genero: showGender,
            fecha_nacimiento: formattedDob
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
