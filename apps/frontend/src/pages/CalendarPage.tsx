import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  color: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
  };
};

type Profile = {
  family: {
    id: string;
  };
};

type CalendarEventFormState = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  color: string;
  category: string;
};

const defaultFormState = (): CalendarEventFormState => ({
  title: '',
  description: '',
  startAt: '',
  endAt: '',
  isAllDay: false,
  color: '#3b82f6',
  category: '',
});

const pad = (value: number) => String(value).padStart(2, '0');

const toDateTimeLocalValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toDateValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

const toIsoFromInput = (value: string, isAllDay: boolean) => {
  if (!value) return '';
  if (isAllDay) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toISOString();
  }
  return new Date(value).toISOString();
};

const formatDateTime = (value: string, isAllDay: boolean) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', {
    weekday: isAllDay ? 'short' : undefined,
    day: '2-digit',
    month: 'short',
    hour: isAllDay ? undefined : '2-digit',
    minute: isAllDay ? undefined : '2-digit',
  }).format(date);
};

export const CalendarPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CalendarEventFormState>(defaultFormState());

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      try {
        const [profileResponse, eventsResponse] = await Promise.all([
          apiClient.get<Profile>('/auth/me'),
          apiClient.get<CalendarEventItem[]>('/calendar-events'),
        ]);

        if (!alive) {
          return;
        }

        setFamilyId(profileResponse.data.family.id);
        setEvents(eventsResponse.data);
      } catch {
        if (alive) {
          setError('No pudimos cargar el calendario familiar.');
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!familyId) {
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:3000';

    const calendarSocket = io(socketUrl, {
      transports: ['websocket'],
    });

    calendarSocket.on('connect', () => {
      calendarSocket.emit('joinFamilyRoom', familyId);
    });

    calendarSocket.on('calendarEventsUpdated', (nextEvents: CalendarEventItem[]) => {
      setEvents(nextEvents);
    });

    return () => {
      calendarSocket.off('calendarEventsUpdated');
      calendarSocket.disconnect();
    };
  }, [familyId]);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultFormState());
  };

  const fillFormFromSelection = (info: DateSelectArg) => {
    const start = info.start;
    const end = info.end ?? new Date(info.start.getTime() + 60 * 60 * 1000);

    if (info.allDay) {
      const nextDay = new Date(start);
      nextDay.setDate(nextDay.getDate() + 1);

      setForm({
        title: '',
        description: '',
        startAt: toDateValue(start.toISOString()),
        endAt: toDateValue(end.toISOString()) || toDateValue(nextDay.toISOString()),
        isAllDay: true,
        color: '#3b82f6',
        category: '',
      });
    } else {
      setForm({
        title: '',
        description: '',
        startAt: toDateTimeLocalValue(start.toISOString()),
        endAt: toDateTimeLocalValue(end.toISOString()),
        isAllDay: false,
        color: '#3b82f6',
        category: '',
      });
    }

    setEditingId(null);
  };

  const handleSelect = (info: DateSelectArg) => {
    fillFormFromSelection(info);
  };

  const openEventForEdit = (event: CalendarEventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description ?? '',
      startAt: event.isAllDay ? toDateValue(event.startAt) : toDateTimeLocalValue(event.startAt),
      endAt: event.isAllDay ? toDateValue(event.endAt) : toDateTimeLocalValue(event.endAt),
      isAllDay: event.isAllDay,
      color: event.color,
      category: event.category ?? '',
    });
  };

  const handleEventClick = (info: EventClickArg) => {
    const event = events.find((item) => item.id === info.event.id);
    if (event) {
      openEventForEdit(event);
    }
  };

  const syncEventDates = async (id: string, payload: Partial<CalendarEventFormState>) => {
    const response = await apiClient.patch<CalendarEventItem>(`/calendar-events/${id}`, {
      ...payload,
      startAt: payload.startAt ? toIsoFromInput(payload.startAt, Boolean(payload.isAllDay)) : undefined,
      endAt: payload.endAt ? toIsoFromInput(payload.endAt, Boolean(payload.isAllDay)) : undefined,
    });

    setEvents((current) => current.map((item) => (item.id === id ? response.data : item)));
    return response.data;
  };

  const handleEventDrop = async (info: EventDropArg) => {
    try {
      await syncEventDates(info.event.id, {
        startAt: info.event.startStr,
        endAt: info.event.endStr ?? info.event.startStr,
        isAllDay: info.event.allDay,
      });
    } catch {
      info.revert();
      setError('No se pudo mover el evento.');
    }
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    try {
      await syncEventDates(info.event.id, {
        startAt: info.event.startStr,
        endAt: info.event.endStr ?? info.event.startStr,
        isAllDay: info.event.allDay,
      });
    } catch {
      info.revert();
      setError('No se pudo redimensionar el evento.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.startAt || !form.endAt) return;

    setError(null);
    setIsSubmitting(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      startAt: toIsoFromInput(form.startAt, form.isAllDay),
      endAt: toIsoFromInput(form.endAt, form.isAllDay),
      isAllDay: form.isAllDay,
      color: form.color,
      category: form.category.trim() || undefined,
    };

    try {
      if (editingId) {
        await apiClient.patch<CalendarEventItem>(`/calendar-events/${editingId}`, payload);
      } else {
        await apiClient.post<CalendarEventItem>('/calendar-events', payload);
      }

      resetForm();
    } catch {
      setError('No se pudo guardar el evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;

    try {
      await apiClient.delete(`/calendar-events/${editingId}`);
      resetForm();
    } catch {
      setError('No se pudo eliminar el evento.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const today = new Date();
  const todayKey = today.toDateString();
  const todayEvents = events.filter((item) => new Date(item.startAt).toDateString() === todayKey);
  const weekEvents = events.filter((item) => {
    const start = new Date(item.startAt);
    const diffDays = (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays < 7;
  });

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Calendario familiar</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Agenda compartida</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Volver
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-6 flex flex-col gap-3">
            <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-800">
              Calendar
            </span>
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Organizad eventos sin perder el hilo</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Crea citas, recordatorios y planes familiares en una agenda compartida. También puedes mover o redimensionar
                eventos directamente sobre el calendario.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Eventos</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{events.length}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-amber-700">Hoy</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{todayEvents.length}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Próximos 7 días</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{weekEvents.length}</p>
            </article>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              {isLoading ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                  Cargando calendario...
                </div>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale="es"
                  selectable
                  editable
                  weekends
                  height="auto"
                  allDaySlot
                  selectMirror
                  select={handleSelect}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                  events={events.map((item) => ({
                    id: item.id,
                    title: item.title,
                    start: item.startAt,
                    end: item.endAt,
                    allDay: item.isAllDay,
                    backgroundColor: item.color,
                    borderColor: item.color,
                    textColor: '#ffffff',
                    extendedProps: {
                      description: item.description,
                      category: item.category,
                      creatorName: item.creator.name,
                    },
                  }))}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  buttonText={{
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                  }}
                  selectAllow={(info) => info.start < info.end}
                />
              )}
            </section>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{editingId ? 'Editar evento' : 'Nuevo evento'}</p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">
                      {editingId ? 'Ajusta el evento' : 'Añade algo al calendario'}
                    </h3>
                  </div>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      Limpiar
                    </button>
                  ) : null}
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Título</span>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      placeholder="Ej. Revisión pediátrica"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Descripción</span>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      placeholder="Añade una nota breve"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Inicio</span>
                      <input
                        type={form.isAllDay ? 'date' : 'datetime-local'}
                        value={form.startAt}
                        onChange={(e) => setForm((current) => ({ ...current, startAt: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Fin</span>
                      <input
                        type={form.isAllDay ? 'date' : 'datetime-local'}
                        value={form.endAt}
                        onChange={(e) => setForm((current) => ({ ...current, endAt: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={form.isAllDay}
                        onChange={(e) =>
                          setForm((current) => {
                            if (e.target.checked) {
                              const nextStart = current.startAt ? current.startAt.slice(0, 10) : '';
                              const nextEnd = current.endAt ? current.endAt.slice(0, 10) : nextStart;
                              return {
                                ...current,
                                isAllDay: true,
                                startAt: nextStart,
                                endAt: nextEnd,
                              };
                            }

                            const start = current.startAt ? `${current.startAt}T09:00` : '';
                            const end = current.endAt ? `${current.endAt}T10:00` : '';
                            return {
                              ...current,
                              isAllDay: false,
                              startAt: start,
                              endAt: end,
                            };
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-200"
                      />
                      <span className="text-sm font-medium text-slate-700">Evento de todo el día</span>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Color</span>
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => setForm((current) => ({ ...current, color: e.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 p-1"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Categoría</span>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      placeholder="Médico, colegio, ocio..."
                    />
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear evento'}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        className="inline-flex items-center justify-center rounded-2xl bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Borrar
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Próximos eventos</p>
                <div className="mt-4 space-y-3">
                  {events.slice(0, 6).map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => openEventForEdit(item)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50"
                    >
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{item.title}</div>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(item.startAt, item.isAllDay)} {item.isAllDay ? 'Todo el día' : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                  {events.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No hay eventos todavía. Selecciona un día en el calendario para crear el primero.
                    </div>
                  ) : null}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
};
