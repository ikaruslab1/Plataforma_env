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

  const { nombre, apellido, grado, genero, curp, correo, telefono, participacion } = validatedFields.data;
  
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

export async function verifyUser(formData: FormData) {
  const short_id = formData.get('short_id') as string;
  
  if(!short_id) return { error: "Ingresa un ID válido." };

  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('short_id').eq('short_id', short_id).single();
  
  if (error || !data) {
    return { error: "ID no encontrado en el sistema." };
  }
  
  // We return the path to redirect to, handled by client to avoid 'NEXT_REDIRECT' error in try/catch blocks if any
  return { success: true, redirectUrl: `/profile/${data.short_id}` };
}
