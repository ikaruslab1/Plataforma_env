"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { generateShortId, GradoAcademico } from "@/lib/utils"
// import { redirect } from "next/navigation" // Using redirect inside verifyUser

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

import { cookies } from "next/headers"

export async function verifyUser(formData: FormData) {
  const raw_id = formData.get('short_id') as string;
  const short_id = raw_id ? raw_id.trim().toUpperCase() : '';
  
  if(!short_id) return { error: "Ingresa un ID válido." };

  // Lógica de acceso Admin
  if (short_id === "ADMIN-0000") {
    (await cookies()).set("admin_session", "true", {
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

export async function getUserAttendance(short_id: string) {
  const supabase = await createClient();
  
  // First get profile_id
  const { data: profile } = await supabase.from('profiles').select('id').eq('short_id', short_id).single();
  if (!profile) return [];

  const { data: attendance, error } = await supabase
    .from('event_attendance')
    .select('event_id, is_interested, has_attended')
    .eq('profile_id', profile.id);

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
