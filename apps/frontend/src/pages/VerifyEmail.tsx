import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

type VerificationState = { email?: string };

export const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as VerificationState | null;
  const [email, setEmail] = useState(locationState?.email ?? localStorage.getItem('pendingVerificationEmail') ?? '');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      await apiClient.post('/auth/verify-email', { email, code });
      localStorage.removeItem('pendingVerificationEmail');
      setMessage('Correo verificado correctamente. Ya puedes iniciar sesión.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (err: any) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage ?? 'El código no es válido o ha caducado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setIsResending(true);
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setMessage('Te hemos enviado un código nuevo.');
    } catch (err: any) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage ?? 'No se pudo reenviar el código.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-amber-100 bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
          <div className="text-6xl">✉️</div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Una última comprobación</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Confirma tu correo</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">Hemos enviado un código de seis dígitos a tu correo para terminar de crear tu cuenta.</p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Verificación</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Introduce tu código</h2><p className="mt-2 text-sm text-slate-600">El código caduca en 10 minutos.</p></div>
          {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {message && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          <form onSubmit={handleVerify} className="space-y-5">
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Correo electrónico</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100" /></label>
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Código de verificación</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-3xl font-bold tracking-[0.45em] text-slate-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="000000" /></label>
            <button type="submit" disabled={isLoading || code.length !== 6} className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70">{isLoading ? 'Comprobando...' : 'Verificar correo'}</button>
          </form>
          <button type="button" onClick={() => void handleResend()} disabled={isResending || !email} className="mt-5 w-full text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50">{isResending ? 'Enviando...' : 'Reenviar código'}</button>
          <Link to="/login" className="mt-5 block text-center text-sm text-slate-500 hover:text-slate-700">Volver al inicio de sesión</Link>
        </section>
      </div>
    </main>
  );
};
