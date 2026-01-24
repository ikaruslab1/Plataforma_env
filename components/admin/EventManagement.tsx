"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom" // Adjust based on React version, might be "react-dom" or "react" for hooks
import { createEvent, updateEvent, deleteEvent } from "@/app/actions"
import { PlusIcon, PencilIcon, TrashIcon, XIcon, CalendarIcon, Loader2 } from "lucide-react"

type Event = {
  id: string
  name: string
  description?: string
  event_date: string
}

const initialState = {
  success: false,
  message: "",
  errors: undefined,
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </button>
  )
}

export function EventManagement({ initialEvents }: { initialEvents: any[] }) {
  // We can't easily rely on server data refresh without router.refresh()
  // But for now, let's assume the page revalidates or we just strictly follow the requested structure.
  // Ideally, after server action, we call router.refresh() or similar.
  // Since 'useFormState' is used, we might need a way to refresh the list.
  // For simplicity given the scope, I'll rely on Next.js automatic revalidation if actions revalidatePath (which I need to add to actions if not automatic).
  // Wait, I didn't add revalidatePath to actions. I should likely do that or use router.refresh().

  const [isOpen, setIsOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setIsOpen(true)
  }

  const handleCreate = () => {
    setEditingEvent(null)
    setIsOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Gestión de Agenda del Evento</h2>
          <p className="text-muted-foreground text-sm">Administra los eventos, fechas y horarios.</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar Evento
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Evento</th>
                <th scope="col" className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div>{event.name}</div>
                    {event.description && <div className="text-xs text-gray-500 font-normal mt-0.5 max-w-[200px] truncate">{event.description}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        {new Date(event.event_date).toLocaleString("es-MX", { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <DeleteButton id={event.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {initialEvents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay eventos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <EventModal
          event={editingEvent}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

function DeleteButton({ id }: { id: string }) {
    // Separate component to handle form action specifically
    // We use a form to invoke the server action
    return (
        <form action={async (formData) => {
             if(confirm("¿Estás seguro de eliminar este evento?")) {
                 await deleteEvent(formData)
                 // Trigger refresh logic if accessible, or full page reload if needed
                 // For now relying on standard Next.js behavior
                 window.location.reload()
             }
        }}>
            <input type="hidden" name="id" value={id} />
             <button
                type="submit"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
            >
                <TrashIcon className="h-4 w-4" />
            </button>
        </form>
    )
}

function EventModal({ event, onClose }: { event: Event | null, onClose: () => void }) {
  // Using basic action handling with reload for simplicity in this turn
  // A cleaner approach would use state and error handling
  
  async function action(formData: FormData) {
      let result;
      if (event) {
          result = await updateEvent(null, formData);
      } else {
          result = await createEvent(null, formData);
      }
      
      if (result.success) {
          window.location.reload(); // Refresh to see changes
      } else {
          alert(result.message || "Error al guardar");
      }
  }

  // Helper to format date for datetime-local input
  const defaultDate = event?.event_date 
    ? new Date(event.event_date).toISOString().slice(0, 16) 
    : new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b p-4 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">
            {event ? "Editar Evento" : "Nuevo Evento"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form action={action} className="p-4 space-y-4">
          {event && <input type="hidden" name="id" value={event.id} />}
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre del Evento</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              defaultValue={event?.name}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
              placeholder="Ej. Conferencia Magistral"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">Descripción (Opcional)</label>
            <textarea
              name="description"
              id="description"
              rows={3}
              defaultValue={event?.description}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all resize-none"
              placeholder="Detalles sobre el evento..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="event_date" className="text-sm font-medium text-gray-700">Fecha y Hora</label>
            <input
              type="datetime-local"
              name="event_date"
              id="event_date"
              required
              defaultValue={defaultDate}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <SubmitButton label={event ? "Guardar Cambios" : "Crear Evento"} />
          </div>
        </form>
      </div>
    </div>
  )
}
