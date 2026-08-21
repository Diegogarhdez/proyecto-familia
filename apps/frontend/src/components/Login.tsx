import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const accessToken = response.data.accessToken ?? response.data.access_token;

      if (!accessToken) {
        throw new Error('El backend no devolvió un token');
      }

      login(accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Correo o contraseña incorrectos');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión. Inténtalo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-amber-100 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.15),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(45,212,191,0.13),_transparent_26%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Centro familiar
            </div>

            <div className="max-w-xl">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Vuelve a casa con un solo clic.
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                Gestiona la familia con calma: compras compartidas, tareas pendientes, calendario y todo lo que necesitáis
                para organizar el día a día con más claridad.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Compras', 'Siempre sincronizadas'],
                ['Calendario', 'Pensado para todos'],
                ['Tareas', 'Pendientes visibles'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-3xl border border-white/70 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">{title}</div>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Acceso</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-slate-600">
              Entra para ver tu espacio familiar, tus compras y los cambios en tiempo real.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Correo electrónico</span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                placeholder="tu@correo.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Contraseña</span>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Escribe tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 my-auto h-9 rounded-xl px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Cargando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
            <p>
              ¿No tienes cuenta?{' '}
              <Link className="font-semibold text-emerald-700 hover:text-emerald-800" to="/register">
                Regístrate
              </Link>
            </p>
            <p>
              ¿Tienes un código de invitación?{' '}
              <Link className="font-semibold text-emerald-700 hover:text-emerald-800" to="/join">
                Únete aquí
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
