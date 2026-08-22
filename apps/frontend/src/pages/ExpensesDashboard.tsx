import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

type Contribution = { userId: string; amount: number; user: { id: string; name: string } };
type Category = { id: string; name: string; emoji: string; monthlyLimit: number; spent: number; percentage: number };
type Expense = { id: string; name: string; emoji: string; amount: number; month: string; createdAt: string; category?: { name: string; emoji: string } | null };
type Dashboard = { month: string; myIncome: number; totalIncome: number; totalSpent: number; available: number; contributions: Contribution[]; categories: Category[]; expenses: Expense[] };

const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const dateFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
const categoryEmojiOptions = ['📦', '🏠', '🍎', '🚗', '🎬', '🛍️', '💡', '🧾', '🐾', '🎓', '🏥', '✈️'];
const expenseEmojiOptions = ['💳', '💵', '💶', '🪙', '🏦', '📱', '🧾', '🛒', '🚗', '🍽️', '🏠', '🎁'];
const currentMonth = () => new Date().toISOString().slice(0, 7);
const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

const shiftMonth = (month: string, offset: number) => {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + offset);
  return date.toISOString().slice(0, 7);
};

const formatMonth = (month: string) => {
  const label = monthFormatter.format(new Date(`${month}-01T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const ExpensesDashboard = () => {
  const { logout } = useAuth();
  const { subscribe } = useRealtime();
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [income, setIncome] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseEmoji, setExpenseEmoji] = useState('💳');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryEmoji, setCategoryEmoji] = useState('📦');
  const [categoryLimit, setCategoryLimit] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([apiClient.get<{ id: string; family: { id: string } }>('/auth/me'), apiClient.get<Dashboard>(`/expenses/dashboard?month=${month}`)])
      .then(([profile, response]) => {
        if (!alive) return;
        setCurrentUserId(profile.data.id);
        setDashboard(response.data);
        setIncome('');
      })
      .catch(() => alive && setError('No pudimos cargar el control de gastos.'))
      .finally(() => alive && setIsLoading(false));
    return () => { alive = false; };
  }, [month]);

  useEffect(() => subscribe('expensesUpdated', (payload) => {
    const nextDashboard = payload as Dashboard;
    if (nextDashboard.month === month) {
      setDashboard(nextDashboard);
      setIncome('');
    }
  }), [month, subscribe]);

  const submitIncome = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiClient.patch('/expenses/income', { month, amount: Number(income) || 0 });
      setIncome('');
    }
    catch { setError('No se pudo guardar tu aportación.'); }
  };

  const removeIncome = async () => {
    try {
      await apiClient.delete(`/expenses/income/${month}`);
      setError(null);
    } catch {
      setError('No se pudo eliminar tu aportación.');
    }
  };

  const submitCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await apiClient.post('/expenses/categories', { name: categoryName.trim(), emoji: categoryEmoji.trim() || '📦', monthlyLimit: Number(categoryLimit) || 0 });
      setCategoryName(''); setCategoryLimit('');
    } catch { setError('No se pudo crear la categoría.'); }
  };

  const submitExpense = async (event: FormEvent) => {
    event.preventDefault();
    if (!expenseName.trim() || Number(expenseAmount) <= 0) return;
    try {
      await apiClient.post('/expenses', { month, name: expenseName.trim(), emoji: expenseEmoji.trim() || '💳', amount: Number(expenseAmount), categoryId: expenseCategory || undefined });
      setExpenseName(''); setExpenseAmount('');
    } catch { setError('No se pudo añadir el gasto.'); }
  };

  const removeExpense = async (id: string) => {
    try { await apiClient.delete(`/expenses/${id}?month=${month}`); }
    catch { setError('No se pudo eliminar el gasto.'); }
  };

  const totalBudget = useMemo(() => dashboard?.categories.reduce((sum, category) => sum + category.monthlyLimit, 0) ?? 0, [dashboard]);
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-sm font-medium text-slate-500">Economía familiar</p><h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Control de gastos</h1></div>
          <div className="flex items-center gap-3"><Link to="/dashboard" className="rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">Volver</Link><button type="button" onClick={handleLogout} className="rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">Cerrar sesión</button></div>
        </header>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-teal-800">Finanzas</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Una vista clara del dinero familiar</h2>
            </div>
            <div className="flex items-center gap-2 self-start rounded-[22px] border border-slate-200 bg-slate-50 p-2 sm:self-auto">
              <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-lg text-slate-600 shadow-sm transition hover:bg-teal-50 hover:text-teal-700" aria-label="Mes anterior">←</button>
              <div className="relative min-w-36 text-center">
                <span className="pointer-events-none block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Mes activo</span>
                <span className="pointer-events-none block text-sm font-bold text-slate-800">{formatMonth(month)}</span>
                <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Elegir mes" />
              </div>
              <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-lg text-slate-600 shadow-sm transition hover:bg-teal-50 hover:text-teal-700" aria-label="Mes siguiente">→</button>
            </div>
          </div>

          {isLoading ? <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Cargando gastos...</div> : dashboard && <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[24px] bg-teal-50 p-5"><p className="text-sm text-teal-700">Ingresos familiares</p><p className="mt-2 text-2xl font-bold text-slate-900">{money.format(dashboard.totalIncome)}</p></article>
              <article className="rounded-[24px] bg-rose-50 p-5"><p className="text-sm text-rose-700">Gastado este mes</p><p className="mt-2 text-2xl font-bold text-slate-900">{money.format(dashboard.totalSpent)}</p></article>
              <article className={`rounded-[24px] p-5 ${dashboard.available >= 0 ? 'bg-emerald-50' : 'bg-orange-100'}`}><p className="text-sm text-slate-600">Disponible</p><p className="mt-2 text-2xl font-bold text-slate-900">{money.format(dashboard.available)}</p></article>
              <article className="rounded-[24px] bg-sky-50 p-5"><p className="text-sm text-sky-700">Límites configurados</p><p className="mt-2 text-2xl font-bold text-slate-900">{money.format(totalBudget)}</p></article>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <form onSubmit={submitIncome} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-semibold text-slate-900">Mi aportación mensual</h3><p className="mt-1 text-sm text-slate-500">Registra lo que aportas tú en el mes seleccionado.</p><div className="mt-4 flex flex-wrap gap-2"><input type="number" min="0" step="0.01" value={income} onChange={(event) => setIncome(event.target.value)} placeholder="0,00" className="min-h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900" /><button type="submit" className="rounded-2xl bg-teal-500 px-4 text-sm font-semibold text-white">Guardar</button></div></form>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-semibold text-slate-900">Aportaciones de la familia</h3><div className="mt-3 space-y-2">{dashboard.contributions.length === 0 ? <p className="text-sm text-slate-500">Todavía no hay aportaciones.</p> : dashboard.contributions.map((contribution) => <div key={contribution.userId} className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-600">{contribution.user.name}</span><div className="flex items-center gap-3"><strong className="text-slate-900">{money.format(contribution.amount)}</strong>{contribution.userId === currentUserId && <button type="button" onClick={() => void removeIncome()} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">Eliminar</button>}</div></div>)}</div></div>
            </div>

            <div className="mt-6"><h3 className="text-xl font-semibold text-slate-900">Presupuesto por categoría</h3><div className="mt-3 grid gap-4 md:grid-cols-2">{dashboard.categories.map((category) => <div key={category.id} className="rounded-[24px] border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><span className="font-semibold text-slate-900">{category.emoji} {category.name}</span><span className="text-sm text-slate-500">{money.format(category.spent)} / {money.format(category.monthlyLimit)}</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${category.percentage >= 100 ? 'bg-rose-500' : category.percentage > 80 ? 'bg-orange-400' : 'bg-teal-500'}`} style={{ width: `${Math.min(category.percentage, 100)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{category.percentage}% del límite</p></div>)}</div></div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <form onSubmit={submitCategory} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-semibold text-slate-900">Añadir categoría</h3><p className="mt-3 text-sm font-medium text-slate-600">Elige un emoji para identificarla</p><div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-12">{categoryEmojiOptions.map((emoji) => <button key={emoji} type="button" onClick={() => setCategoryEmoji(emoji)} className={`grid aspect-square min-w-0 place-items-center rounded-xl border bg-white text-xl transition hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-50 ${categoryEmoji === emoji ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : 'border-slate-200'}`} aria-label={`Elegir emoji ${emoji}`} aria-pressed={categoryEmoji === emoji}>{emoji}</button>)}</div><div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]"><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Vivienda, ocio..." className="rounded-2xl border border-slate-200 bg-white px-4" /><input type="number" min="0" step="0.01" value={categoryLimit} onChange={(event) => setCategoryLimit(event.target.value)} placeholder="Límite" className="rounded-2xl border border-slate-200 bg-white px-3" /></div><button className="mt-3 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white">Guardar categoría</button></form>
              <form onSubmit={submitExpense} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-semibold text-slate-900">Añadir gasto</h3><p className="mt-3 text-sm font-medium text-slate-600">Elige cómo identificar el gasto</p><div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-12">{expenseEmojiOptions.map((emoji) => <button key={emoji} type="button" onClick={() => setExpenseEmoji(emoji)} className={`grid aspect-square min-w-0 place-items-center rounded-xl border bg-white text-xl transition hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-50 ${expenseEmoji === emoji ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-slate-200'}`} aria-label={`Elegir emoji ${emoji}`} aria-pressed={expenseEmoji === emoji}>{emoji}</button>)}</div><div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]"><input value={expenseName} onChange={(event) => setExpenseName(event.target.value)} placeholder="Compra, gasolina..." className="rounded-2xl border border-slate-200 bg-white px-4" /><input type="number" min="0.01" step="0.01" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="Importe" className="rounded-2xl border border-slate-200 bg-white px-3" /></div><select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5"><option value="">Sin categoría</option>{dashboard.categories.map((category) => <option key={category.id} value={category.id}>{category.emoji} {category.name}</option>)}</select><button className="mt-3 rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white">Añadir gasto</button></form>
            </div>

            <div className="mt-6"><h3 className="text-xl font-semibold text-slate-900">Gastos del mes</h3><div className="mt-3 space-y-2">{dashboard.expenses.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Todavía no hay gastos registrados.</p> : dashboard.expenses.map((expense) => <div key={expense.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><p className="font-semibold text-slate-900">{expense.emoji} {expense.name}</p><p className="text-xs text-slate-500">{expense.category ? `${expense.category.emoji} ${expense.category.name}` : 'Sin categoría'} · {dateFormatter.format(new Date(expense.createdAt))}</p></div><div className="flex items-center gap-3"><strong className="text-slate-900">{money.format(expense.amount)}</strong><button type="button" onClick={() => void removeExpense(expense.id)} className="text-xs font-semibold text-rose-700">Borrar</button></div></div>)}</div></div>
          </>}
          {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        </section>
      </div>
    </main>
  );
};
