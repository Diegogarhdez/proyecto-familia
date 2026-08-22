import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Calendario familiar',
    description: 'Eventos, reuniones y recordatorios compartidos en un solo lugar.',
    accent: 'bg-amber-400',
    icon: '📅',
    kind: 'feature' as const,
    href: '/calendar',
  },
  {
    title: 'Lista de la compra',
    description: 'Añade lo que falta en casa y tenlo a mano desde cualquier dispositivo.',
    accent: 'bg-emerald-400',
    icon: '🛒',
    kind: 'feature' as const,
    href: '/shopping',
  },
  {
    title: 'Planificación de tareas',
    description: 'Reparte las tareas semanales de forma equilibrada según tiempo, esfuerzo y frecuencia.',
    accent: 'bg-sky-400',
    icon: '🎯',
    kind: 'feature' as const,
    href: '/task-planning',
  },
  {
    title: 'Ideas y planes',
    description: 'Una zona para proponer salidas, actividades y planes del fin de semana.',
    accent: 'bg-orange-400',
    icon: '💡',
    kind: 'feature' as const,
    href: '/ideas-plans',
  },
  {
    title: 'Tareas pendientes',
    description: 'Un vistazo rápido a lo que queda por hacer hoy o durante la semana.',
    accent: 'bg-yellow-400',
    icon: '📓',
    kind: 'tasks' as const,
    href: '/tasks',
  },
  {
    title: 'Recetas de cocina',
    description: 'Recetas rápidas y familiares para las comidas de todos los días.',
    accent: 'bg-pink-400',
    icon: '🍽️',
    kind: 'feature' as const,
    href: '/recipes',
  },
  {
    title: 'Control de gastos',
    description: 'Llevad un registro claro de los gastos y del presupuesto familiar.',
    accent: 'bg-teal-400',
    icon: '📈',
    kind: 'feature' as const,
    href: '/expenses',
  },
  {
    title: 'Recordatorios',
    description: 'Organiza avisos como la ITV, citas del DNI o visitas médicas. Podrá conectarse con el calendario familiar.',
    accent: 'bg-violet-400',
    icon: '🔔',
    kind: 'feature' as const,
  },
  {
    title: 'Baúl de información',
    description: 'Guarda información valiosa de la familia para tenerla siempre a mano, sin necesidad de ocultarla.',
    accent: 'bg-lime-400',
    icon: '🗃️',
    kind: 'feature' as const,
  },
  {
    title: 'Planificador de menús semanales',
    description: 'Planifica las comidas de la semana con sinergia entre tus recetas y la lista de la compra.',
    accent: 'bg-rose-400',
    icon: '🍲',
    kind: 'feature' as const,
  },
];

type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  family: {
    id: string;
    name: string;
    inviteCode: string;
  };
  familyCode: string | null;
};

export const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadProfile = async () => {
      try {
        const response = await apiClient.get<Profile>('/auth/me');

        if (!alive) {
          return;
        }

        setProfile(response.data);
        localStorage.setItem('displayName', response.data.name);
        localStorage.setItem('familyName', response.data.family.name);

        if (response.data.familyCode) {
          localStorage.setItem('familyCode', response.data.familyCode);
        } else {
          localStorage.removeItem('familyCode');
        }
      } catch {
        if (alive) {
          setError('No pudimos cargar tus datos reales de sesión.');
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      alive = false;
    };
  }, []);

  const displayName = profile?.name ?? localStorage.getItem('displayName') ?? 'Miembro de la familia';
  const familyName = profile?.family.name ?? localStorage.getItem('familyName') ?? 'Familia pendiente';
  const familyCode = profile?.familyCode ?? localStorage.getItem('familyCode');
  const isAdmin = profile?.role === 'ADMIN';
  const avatarLetter = (displayName.trim().charAt(0) || 'F').toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Cerrar sesión
            </button>

            <div>
              <p className="text-sm font-medium text-slate-500">Espacio familiar</p>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{familyName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            <div className="text-right">
              <p className="text-sm text-slate-500">Hola</p>
              <div className="flex items-center justify-end gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  {isAdmin ? 'Administrador' : 'Miembro'}
                </span>
                <p className="text-base font-semibold text-slate-900">{displayName}</p>
              </div>
              {isAdmin && familyCode ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                  <span>Código de familia</span>
                  <span className="font-mono tracking-[0.2em]">{familyCode}</span>
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                  Código oculto para miembros
                </div>
              )}
            </div>

            <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-emerald-300 text-lg font-bold text-white shadow-lg shadow-amber-100">
              {avatarLetter}
            </div>
          </div>
        </header>

        {error && (
          <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </section>
        )}

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-8 flex flex-col gap-4">
            <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-800">
              Dashboard familiar
            </span>
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {isLoading ? 'Cargando tu espacio familiar...' : 'Todo lo importante de la familia, en un mismo sitio.'}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {isLoading
                  ? 'Estamos trayendo tu nombre real, tu familia y tus permisos desde el servidor.'
                  : 'Aquí tendrás acceso visual a las herramientas principales. Aún no están conectadas, pero esta es la base para organizar la vida familiar de una forma clara y agradable.'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(isLoading ? features.slice(0, 2) : features).map((feature) => (
              <article
                key={feature.title}
                className="flex min-h-[210px] flex-col justify-between rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
              >
                <div>
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${feature.accent}`} aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  {feature.kind === 'tasks' ? (
                    <div className="mt-4 space-y-3">
                      {[
                        'Añadir la compra de esta semana',
                        'Revisar eventos del calendario familiar',
                        'Asignar quién recoge a los niños',
                        'Preparar la lista de tareas del fin de semana',
                      ].map((task) => (
                        <div key={task} className="flex items-start gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                          <span className="text-sm leading-6 text-slate-600">{task}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
                  )}
                </div>

                {feature.href ? (
                  <Link
                    to={feature.href}
                    className="mt-5 inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Abrir
                  </Link>
                ) : (
                  <span className="mt-5 inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                    Próximamente
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>
        

      </div>
    </main>
  );
};
