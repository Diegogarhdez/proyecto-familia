import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

type Member = { id: string; name: string; role: 'ADMIN' | 'MEMBER' };
type PlanningTask = {
  id: string;
  name: string;
  timeMinutes: number;
  effort: number;
  weeklyFrequency: number;
  preferredUserId: string | null;
  preferredUser: { id: string; name: string } | null;
};
type Assignment = {
  id: string;
  weight: number;
  wasPreferred: boolean;
  task: PlanningTask;
  assignedUser: { id: string; name: string };
};
type Plan = { id: string; weekStart: string; assignments: Assignment[] } | null;

const emptyForm = { name: '', timeMinutes: 30, effort: 1, weeklyFrequency: 1, preferredUserId: '' };

function mondayDate() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export const TaskPlanningPage = () => {
  const { logout } = useAuth();
  const { subscribe } = useRealtime();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [plan, setPlan] = useState<Plan>(null);
  const [weekStart, setWeekStart] = useState(mondayDate);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (selectedWeek: string) => {
    try {
      const [membersResponse, tasksResponse, planResponse] = await Promise.all([
        apiClient.get<Member[]>('/task-planning/members'),
        apiClient.get<PlanningTask[]>('/task-planning/tasks'),
        apiClient.get<Plan>(`/task-planning/plans?weekStart=${selectedWeek}`),
      ]);
      setMembers(membersResponse.data);
      setTasks(tasksResponse.data);
      setPlan(planResponse.data);
    } catch {
      setError('No pudimos cargar la planificación familiar.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(weekStart); }, [weekStart]);
  useEffect(() => subscribe('taskPlanUpdated', (payload) => setPlan(payload as Plan)), [subscribe]);
  useEffect(() => subscribe('tasksListUpdated', () => { void load(weekStart); }), [subscribe, weekStart]);

  const loads = useMemo(() => {
    const totals = new Map(members.map((member) => [member.id, 0]));
    plan?.assignments.forEach((assignment) => {
      totals.set(assignment.assignedUser.id, (totals.get(assignment.assignedUser.id) ?? 0) + assignment.weight);
    });
    const max = Math.max(...totals.values(), 0);
    return members.map((member) => ({ ...member, weight: totals.get(member.id) ?? 0, percentage: max ? ((totals.get(member.id) ?? 0) / max) * 100 : 0 }));
  }, [members, plan]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiClient.post<PlanningTask>('/task-planning/tasks', {
        ...form,
        name: form.name.trim(),
        preferredUserId: form.preferredUserId || null,
      });
      setTasks((current) => [response.data, ...current]);
      setForm(emptyForm);
    } catch {
      setError('No se pudo guardar la tarea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await apiClient.post<Plan>('/task-planning/generate', { weekStart });
      setPlan(response.data);
    } catch {
      setError('No se pudo generar el reparto semanal.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Organización familiar</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Planificación de tareas</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Volver</Link>
            <button type="button" onClick={handleLogout} className="rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100">Cerrar sesión</button>
          </div>
        </header>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-8 max-w-3xl">
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">Reparto inteligente</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Reparte las tareas con equilibrio</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">El sistema respeta las preferencias y utiliza el peso de cada tarea para mantener las cargas semanales lo más equilibradas posible.</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <form onSubmit={handleCreate} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Nueva tarea planificable</h3>
              <div className="mt-4 space-y-3">
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Limpiar el baño" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs font-semibold text-slate-500">Minutos<input type="number" min="1" value={form.timeMinutes} onChange={(event) => setForm({ ...form, timeMinutes: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
                  <label className="text-xs font-semibold text-slate-500">Esfuerzo 1-5<input type="number" min="1" max="5" value={form.effort} onChange={(event) => setForm({ ...form, effort: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
                  <label className="text-xs font-semibold text-slate-500">Veces/semana<input type="number" min="1" max="7" value={form.weeklyFrequency} onChange={(event) => setForm({ ...form, weeklyFrequency: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
                </div>
                <label className="block text-xs font-semibold text-slate-500">Preferencia opcional<select value={form.preferredUserId} onChange={(event) => setForm({ ...form, preferredUserId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Sin preferencia</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
                <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-800">Peso = tiempo × esfuerzo × frecuencia semanal.</p>
                <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60">{isSubmitting ? 'Guardando...' : 'Añadir tarea'}</button>
              </div>
            </form>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 className="text-lg font-semibold text-slate-900">Reparto semanal</h3><p className="mt-1 text-sm text-slate-500">Las preferencias se aplican antes del reparto equitativo.</p></div>
                <div className="flex items-center gap-2"><input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={() => void generate()} disabled={isGenerating || tasks.length === 0} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">{isGenerating ? 'Calculando...' : 'Generar'}</button></div>
              </div>
              <div className="mt-5 space-y-3">{loads.map((member) => <div key={member.id}><div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{member.name}</span><span className="text-slate-500">{member.weight.toFixed(1)} puntos</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${member.percentage}%` }} /></div></div>)}{members.length === 0 && <p className="text-sm text-slate-500">Cargando miembros...</p>}</div>
            </div>
          </div>

          {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-6 overflow-x-auto rounded-[24px] border border-slate-200">
            <table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Tarea</th><th className="px-4 py-3">Peso</th><th className="px-4 py-3">Asignada a</th><th className="px-4 py-3">Origen</th></tr></thead><tbody className="divide-y divide-slate-100">{plan?.assignments.map((assignment) => <tr key={assignment.id}><td className="px-4 py-3 font-medium text-slate-800">{assignment.task.name}</td><td className="px-4 py-3 text-slate-600">{assignment.weight.toFixed(1)}</td><td className="px-4 py-3 text-slate-700">{assignment.assignedUser.name}</td><td className="px-4 py-3">{assignment.wasPreferred ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Preferencia</span> : <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Equitativo</span>}</td></tr>)}</tbody></table>
            {!isLoading && !plan && <p className="px-4 py-6 text-center text-sm text-slate-500">Todavía no hay reparto para esta semana. Añade tareas y pulsa Generar.</p>}
          </div>

          {tasks.length > 0 && <div className="mt-6 grid gap-3 sm:grid-cols-2">{tasks.map((task) => <article key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-800">{task.name}</p><span className="text-xs font-semibold text-sky-700">{(task.timeMinutes * task.effort * task.weeklyFrequency).toFixed(1)} puntos</span></div><p className="mt-1 text-xs text-slate-500">{task.timeMinutes} min · esfuerzo {task.effort} · {task.weeklyFrequency} vez/semana · {task.preferredUser?.name ?? 'sin preferencia'}</p></article>)}</div>}
        </section>
      </div>
    </main>
  );
};
