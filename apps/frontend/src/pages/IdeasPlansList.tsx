import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

type IdeaPlanItem = {
  id: string;
  name: string;
  isDone: boolean;
  createdAt: string;
};

type Profile = {
  family: {
    id: string;
  };
};

export const IdeasPlansList = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<IdeaPlanItem[]>([]);
  const [name, setName] = useState('');
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      try {
        const [profileResponse, ideasPlansResponse] = await Promise.all([
          apiClient.get<Profile>('/auth/me'),
          apiClient.get<IdeaPlanItem[]>('/ideas-plans'),
        ]);

        if (!alive) {
          return;
        }

        setFamilyId(profileResponse.data.family.id);
        setItems(ideasPlansResponse.data);
      } catch {
        if (alive) {
          setError('No pudimos cargar las ideas y planes.');
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

    const ideasPlansSocket = io(socketUrl, {
      transports: ['websocket'],
    });

    ideasPlansSocket.on('connect', () => {
      ideasPlansSocket.emit('joinFamilyRoom', familyId);
    });

    ideasPlansSocket.on('ideasPlansListUpdated', (nextItems: IdeaPlanItem[]) => {
      setItems(nextItems);
    });

    return () => {
      ideasPlansSocket.off('ideasPlansListUpdated');
      ideasPlansSocket.disconnect();
    };
  }, [familyId]);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post<IdeaPlanItem>('/ideas-plans', {
        name: name.trim(),
      });
      setName('');
    } catch {
      setError('No se pudo añadir la idea o el plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await apiClient.patch<IdeaPlanItem>(`/ideas-plans/${id}/toggle`);
      setItems((current) => current.map((item) => (item.id === id ? response.data : item)));
    } catch {
      setError('No se pudo cambiar el estado de la idea o el plan.');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await apiClient.delete(`/ideas-plans/${id}`);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError('No se pudo eliminar la idea o el plan.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const doneCount = items.filter((item) => item.isDone).length;
  const pendingCount = items.length - doneCount;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Ideas familiares</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Ideas y planes</h1>
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
            <span className="inline-flex w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-orange-800">
              Ideas
            </span>
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Guardad los planes que os ilusionan</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Proponed actividades, escapadas e ideas para disfrutar juntos y marcad las que ya habéis realizado.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Totales</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{items.length}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-orange-700">Pendientes</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingCount}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Realizados</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{doneCount}</p>
            </article>
          </div>

          <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-3 lg:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Añade una idea, por ejemplo: excursión a la montaña..."
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Añadiendo...' : 'Añadir'}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="mt-6">
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                Cargando ideas y planes...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                No hay ideas todavía. Añade la primera para empezar.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className={`flex flex-col gap-4 rounded-[24px] border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                      item.isDone ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id)}
                        className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                          item.isDone ? 'border-emerald-500 bg-emerald-500' : 'border-orange-400 bg-transparent'
                        }`}
                        aria-label={item.isDone ? 'Marcar como pendiente' : 'Marcar como realizado'}
                      >
                        {item.isDone ? <span className="text-[11px] font-black text-white">✓</span> : null}
                      </button>

                      <div className="min-w-0">
                        <div className={`text-base font-semibold ${item.isDone ? 'text-emerald-800 line-through' : 'text-slate-900'}`}>
                          {item.name}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{item.isDone ? 'Realizado' : 'Pendiente'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="inline-flex items-center justify-center rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Borrar
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
