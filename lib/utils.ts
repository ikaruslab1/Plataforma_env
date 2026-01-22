import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type GradoAcademico = 'Doctorado' | 'Maestría' | 'Licenciatura' | 'Estudiante';
export type Genero = 'Masculino' | 'Femenino' | 'Neutro';

export function generateShortId(grado: GradoAcademico) {
  let prefix = "EST";
  if (grado === 'Doctorado') prefix = "DOC";
  if (grado === 'Maestría') prefix = "MTR";
  if (grado === 'Licenciatura') prefix = "LIC";
  
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

export function getDegreeAbbr(grado: GradoAcademico, genero: Genero) {
  if (grado === 'Doctorado') {
    return genero === 'Femenino' ? "Dra." : "Dr.";
  }
  if (grado === 'Maestría') {
    return genero === 'Femenino' ? "Mtra." : "Mtro.";
  }
  if (grado === 'Licenciatura') {
    return "Lic.";
  }
  return "Est.";
}
