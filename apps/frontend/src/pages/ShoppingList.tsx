import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  isBought: boolean;
  createdAt: string;
};

type Profile = {
  family: {
    id: string;
  };
};

export const ShoppingList = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      try {
        const [profileResponse, itemsResponse] = await Promise.all([
          apiClient.get<Profile>('/auth/me'),
          apiClient.get<ShoppingItem[]>('/shopping'),
        ]);

        if (!alive) {
          return;
        }

        setFamilyId(profileResponse.data.family.id);
        setItems(itemsResponse.data);
      } catch {
        if (alive) {
          setError('No pudimos cargar la lista de la compra.');
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

    const SOCKET_URL = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : 'http://localhost:3000';

    const shoppingSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    shoppingSocket.on('connect', () => {
      shoppingSocket.emit('joinFamilyRoom', familyId);
    });

    shoppingSocket.on('shoppingListUpdated', (nextItems: ShoppingItem[]) => {
      setItems(nextItems);
    });

    return () => {
      shoppingSocket.off('shoppingListUpdated');
      shoppingSocket.disconnect();
    };
  }, [familyId]);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post<ShoppingItem>('/shopping', {
        name: name.trim(),
        quantity,
      });

      setName('');
      setQuantity(1);
    } catch {
      setError('No se pudo añadir el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantity = async (id: string, currentQuantity: number, delta: number) => {
    const nextQuantity = Math.max(1, currentQuantity + delta);

    try {
      const response = await apiClient.patch<ShoppingItem>(`/shopping/${id}/quantity`, {
        quantity: nextQuantity,
      });
      setItems((current) => current.map((item) => (item.id === id ? response.data : item)));
    } catch {
      setError('No se pudo actualizar la cantidad.');
    }
  };

  const handleQuantityInput = (id: string, rawValue: string) => {
    const nextQuantity = Math.max(1, Number(rawValue) || 1);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity: nextQuantity } : item)));
  };

  const commitQuantity = async (id: string, quantityToSave: number) => {
    const nextQuantity = Math.max(1, quantityToSave);

    try {
      const response = await apiClient.patch<ShoppingItem>(`/shopping/${id}/quantity`, {
        quantity: nextQuantity,
      });
      setItems((current) => current.map((item) => (item.id === id ? response.data : item)));
    } catch {
      setError('No se pudo actualizar la cantidad.');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await apiClient.patch<ShoppingItem>(`/shopping/${id}/toggle`);
      setItems((current) => current.map((item) => (item.id === id ? response.data : item)));
    } catch {
      setError('No se pudo cambiar el estado del producto.');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await apiClient.delete(`/shopping/${id}`);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError('No se pudo eliminar el producto.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const boughtCount = items.filter((item) => item.isBought).length;
  const pendingCount = items.length - boughtCount;
  const pendingUnits = items
    .filter((item) => !item.isBought)
    .reduce((sum, item) => sum + item.quantity, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Compra familiar</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Lista de la compra</h1>
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
            <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
              Shopping
            </span>
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Todo lo que falta en casa</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Añade productos, ajusta cuántos hacen falta y mantened la lista sincronizada en tiempo real.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Totales</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{items.length}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-amber-700">Pendientes</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingCount}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Comprados</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{boughtCount}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-sky-700">Unidades</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totalUnits}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-orange-700">Pendientes</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingUnits}</p>
            </article>
          </div>

          <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-3 lg:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Añade un producto, por ejemplo: pan, fruta..."
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                aria-label="Cantidad"
                className="min-h-12 w-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Añadiendo...' : 'Añadir'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="mt-6">
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                Cargando productos...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                No hay productos todavía. Añade el primero para empezar.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className={`flex flex-col gap-4 rounded-[24px] border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                      item.isBought
                        ? 'border-emerald-200 bg-emerald-50/80'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id)}
                        className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                          item.isBought
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-emerald-400 bg-transparent'
                        }`}
                        aria-label={item.isBought ? 'Marcar como pendiente' : 'Marcar como comprado'}
                      >
                        {item.isBought ? <span className="text-[11px] font-black text-white">✓</span> : null}
                      </button>

                      <div className="min-w-0">
                        <div
                          className={`text-base font-semibold ${
                            item.isBought ? 'text-emerald-800 line-through' : 'text-slate-900'
                          }`}
                        >
                          {item.name}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{item.isBought ? 'Comprado' : 'Pendiente'}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          <span className="font-medium text-slate-500">Cantidad</span>
                          <button
                            type="button"
                            onClick={() => handleQuantity(item.id, item.quantity, -1)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-slate-700 transition hover:bg-slate-300"
                            aria-label="Disminuir cantidad"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                            onBlur={(e) => void commitQuantity(item.id, Number(e.target.value) || 1)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="h-8 w-16 rounded-xl border border-slate-200 bg-white text-center text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                            aria-label="Cantidad del producto"
                          />
                          <span className="font-medium text-slate-500">uds</span>
                          <button
                            type="button"
                            onClick={() => handleQuantity(item.id, item.quantity, 1)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600"
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>
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
