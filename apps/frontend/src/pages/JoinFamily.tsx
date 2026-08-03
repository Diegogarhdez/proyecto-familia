import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export const JoinFamily = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/join', {
        name,
        email,
        password,
        inviteCode: inviteCode.trim().toUpperCase(),
      });

      localStorage.setItem('displayName', response.data?.name ?? name);
      localStorage.setItem('familyCode', inviteCode.trim().toUpperCase());

      alert('Te has unido a la familia correctamente. Ahora puedes iniciar sesión.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('El código de invitación no es válido.');
      } else if (err.response?.status === 409) {
        setError('Este correo ya está registrado.');
      } else {
        setError('No se pudo completar la invitación. Inténtalo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Invitación</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Unirse a una familia</h1>
            <p className="mt-2 text-sm text-slate-600">
              Usa el código del administrador para entrar en un hogar que ya está creado.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Nombre</span>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder="Tu nombre"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Correo electrónico</span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder="tu@correo.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Contraseña</span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder="Crea una contraseña"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Código de invitación</span>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                placeholder="ABC123"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition uppercase tracking-[0.25em] focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Uniéndose...' : 'Unirse'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Tienes una familia nueva?{' '}
            <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/register">
              Créala aquí
            </Link>
          </p>
        </section>

        <section className="rounded-[32px] border border-sky-100 bg-gradient-to-br from-sky-100 via-cyan-50 to-white p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Acceso seguro para invitados
            </div>

            <div className="max-w-xl">
              <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Entra con el código del administrador.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                Cada familia mantiene su espacio separado. Tú solo necesitas el código correcto para empezar a colaborar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Código corto', '6 caracteres en mayúsculas y números'],
                ['Sin ruido', 'Solo ves lo que pertenece a tu familia'],
                ['Compras', 'Actualizaciones instantáneas'],
                ['Fácil', 'Listo para entrar en pocos pasos'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">{title}</div>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
