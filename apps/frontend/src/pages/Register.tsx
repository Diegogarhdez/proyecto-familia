import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const getRegisterErrorMessage = (err: any) => {
    const responseData = err?.response?.data;
    const rawMessage = responseData?.message;
    const messages = Array.isArray(rawMessage)
      ? rawMessage
      : typeof rawMessage === 'string'
        ? [rawMessage]
        : [];

    const passwordMessage = messages.find((message) => message.toLowerCase().includes('contraseña'));
    if (passwordMessage) {
      return passwordMessage;
    }

    const familyMessage = messages.find((message) => message.toLowerCase().includes('family') || message.toLowerCase().includes('famil'));
    if (familyMessage) {
      return familyMessage;
    }

    if (messages.length > 0) {
      return messages[0];
    }

    return 'Error al registrar. Inténtalo de nuevo.';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        familyName,
      });

      const family = response.data?.family;
      if (family) {
        localStorage.setItem('displayName', response.data?.name ?? name);
        localStorage.setItem('familyName', family.name ?? familyName);
        localStorage.setItem('familyCode', family.inviteCode ?? '');
      }

      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Este correo ya está registrado.');
      } else if (err.response?.status === 400) {
        setError(getRegisterErrorMessage(err));
      } else {
        setError(getRegisterErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="order-2 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:p-8 lg:order-1">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Nueva familia</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Crear cuenta</h1>
            <p className="mt-2 text-sm text-slate-600">
              Empieza con tu familia desde cero y genera un espacio compartido para compras, tareas y planes.
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                placeholder="Crea una contraseña segura"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Nombre de la familia</span>
              <input
                id="familyName"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                placeholder="Familia García"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
            <p>
              ¿Ya tienes cuenta?{' '}
              <Link className="font-semibold text-amber-700 hover:text-amber-800" to="/login">
                Inicia sesión
              </Link>
            </p>
            <p>
              ¿Tienes un código de invitación?{' '}
              <Link className="font-semibold text-amber-700 hover:text-amber-800" to="/join">
                Únete aquí
              </Link>
            </p>
          </div>
        </section>

        <section className="order-1 overflow-hidden rounded-[32px] border border-amber-100 bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] lg:order-2">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Un espacio que crece con vosotros
            </div>

            <div className="max-w-xl">
              <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Una familia, una sola pantalla para organizarlo todo.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                Crea una familia y deja listo un punto de encuentro para ver la compra, planificar tareas y preparar el día
                a día sin complicaciones.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Código privado', 'Solo el administrador lo comparte'],
                ['Diseño claro', 'Más amable y fácil de usar'],
                ['Compras', 'Con cantidades visibles'],
                ['Tareas', 'Por hacer y pendientes'],
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
