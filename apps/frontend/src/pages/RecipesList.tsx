import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

type RecipeUnit = 'GRAMS' | 'KILOGRAMS' | 'MILLILITERS' | 'LITERS' | 'TABLESPOONS' | 'OUNCES' | 'UNITS';

type IngredientForm = {
  name: string;
  quantity: string;
  unit: RecipeUnit;
};

type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: RecipeUnit;
};

type RecipeStep = {
  id: string;
  description: string;
  position: number;
};

type Recipe = {
  id: string;
  name: string;
  createdAt: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

type Profile = {
  family: {
    id: string;
  };
};

const unitLabels: Record<RecipeUnit, string> = {
  GRAMS: 'gramos',
  KILOGRAMS: 'kilogramos',
  MILLILITERS: 'mililitros',
  LITERS: 'litros',
  TABLESPOONS: 'cucharadas',
  OUNCES: 'onzas',
  UNITS: 'unidades',
};

const emptyIngredient = (): IngredientForm => ({
  name: '',
  quantity: '',
  unit: 'GRAMS',
});

export const RecipesList = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientForm[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      try {
        const [profileResponse, recipesResponse] = await Promise.all([
          apiClient.get<Profile>('/auth/me'),
          apiClient.get<Recipe[]>('/recipes'),
        ]);

        if (!alive) return;
        setFamilyId(profileResponse.data.family.id);
        setRecipes(recipesResponse.data);
      } catch {
        if (alive) setError('No pudimos cargar el recetario.');
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void bootstrap();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!familyId) return;

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:3000';
    const recipeSocket = io(socketUrl, { transports: ['websocket'] });

    recipeSocket.on('connect', () => {
      recipeSocket.emit('joinFamilyRoom', familyId);
    });
    recipeSocket.on('recipeListUpdated', (nextRecipes: Recipe[]) => {
      setRecipes(nextRecipes);
    });

    return () => {
      recipeSocket.off('recipeListUpdated');
      recipeSocket.disconnect();
    };
  }, [familyId]);

  const updateIngredient = (index: number, field: keyof IngredientForm, value: string) => {
    setIngredients((current) => current.map((ingredient, ingredientIndex) => (
      ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
    )));
  };

  const updateStep = (index: number, value: string) => {
    setSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? value : step)));
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validIngredients = ingredients.filter((ingredient) => ingredient.name.trim() && Number(ingredient.quantity) > 0);
    const validSteps = steps.map((step) => step.trim()).filter(Boolean);

    if (!recipeName.trim() || validIngredients.length === 0 || validSteps.length === 0) {
      setError('Completa el nombre, al menos un ingrediente válido y un paso.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post<Recipe>('/recipes', {
        name: recipeName.trim(),
        ingredients: validIngredients.map((ingredient) => ({
          name: ingredient.name.trim(),
          quantity: Number(ingredient.quantity),
          unit: ingredient.unit,
        })),
        steps: validSteps,
      });
      setRecipeName('');
      setIngredients([emptyIngredient()]);
      setSteps(['']);
    } catch {
      setError('No se pudo guardar la receta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await apiClient.delete(`/recipes/${id}`);
      setRecipes((current) => current.filter((recipe) => recipe.id !== id));
    } catch {
      setError('No se pudo eliminar la receta.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Cocina familiar</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Recetario</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              Volver
            </Link>
            <button type="button" onClick={handleLogout} className="inline-flex items-center justify-center rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-7 flex flex-col gap-3">
            <span className="inline-flex w-fit rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-pink-800">Recetas</span>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Guardad las recetas de la familia</h2>
            <p className="max-w-3xl text-base leading-7 text-slate-600">Cada receta reúne sus ingredientes con cantidades y unidades, además de los pasos ordenados para cocinarla.</p>
          </div>

          <form onSubmit={handleAdd} className="space-y-6 rounded-[28px] border border-pink-100 bg-pink-50/50 p-5 sm:p-6">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre de la receta</span>
              <input
                type="text"
                value={recipeName}
                onChange={(event) => setRecipeName(event.target.value)}
                placeholder="Por ejemplo: tortilla de patatas"
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
            </label>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Ingredientes</h3>
                <button type="button" onClick={() => setIngredients((current) => [...current, emptyIngredient()])} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-pink-700 shadow-sm transition hover:bg-pink-100">
                  + Añadir ingrediente
                </button>
              </div>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={`ingredient-${index}`} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_10rem_auto]">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(event) => updateIngredient(index, 'name', event.target.value)}
                      placeholder="Ingrediente"
                      aria-label={`Ingrediente ${index + 1}`}
                      className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={ingredient.quantity}
                      onChange={(event) => updateIngredient(index, 'quantity', event.target.value)}
                      placeholder="Cantidad"
                      aria-label={`Cantidad del ingrediente ${index + 1}`}
                      className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                    <select
                      value={ingredient.unit}
                      onChange={(event) => updateIngredient(index, 'unit', event.target.value)}
                      aria-label={`Unidad del ingrediente ${index + 1}`}
                      className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    >
                      {Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <button type="button" onClick={() => setIngredients((current) => current.length === 1 ? current : current.filter((_, ingredientIndex) => ingredientIndex !== index))} className="min-h-11 rounded-2xl bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100" aria-label={`Eliminar ingrediente ${index + 1}`}>
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Pasos</h3>
                <button type="button" onClick={() => setSteps((current) => [...current, ''])} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-pink-700 shadow-sm transition hover:bg-pink-100">
                  + Añadir paso
                </button>
              </div>
              <ol className="space-y-3">
                {steps.map((step, index) => (
                  <li key={`step-${index}`} className="flex items-start gap-3">
                    <span className="mt-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-500 text-sm font-bold text-white">{index + 1}</span>
                    <textarea
                      value={step}
                      onChange={(event) => updateStep(index, event.target.value)}
                      placeholder="Describe este paso..."
                      rows={2}
                      aria-label={`Paso ${index + 1}`}
                      className="min-h-16 flex-1 resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                    <button type="button" onClick={() => setSteps((current) => current.length === 1 ? current : current.filter((_, stepIndex) => stepIndex !== index))} className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100" aria-label={`Eliminar paso ${index + 1}`}>
                      Quitar
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? 'Guardando...' : 'Guardar receta'}
            </button>
          </form>

          {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-8">
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">Cargando recetas...</div>
            ) : recipes.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">Todavía no hay recetas. Guarda la primera para crear vuestro recetario.</div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {recipes.map((recipe) => (
                  <article key={recipe.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-semibold text-slate-900">{recipe.name}</h3>
                      <button type="button" onClick={() => void handleRemove(recipe.id)} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">Borrar</button>
                    </div>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-700">Ingredientes</h4>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                          {recipe.ingredients.map((ingredient) => <li key={ingredient.id}>{ingredient.name}: {ingredient.quantity} {unitLabels[ingredient.unit]}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-700">Preparación</h4>
                        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
                          {recipe.steps.sort((first, second) => first.position - second.position).map((step) => <li key={step.id}>{step.description}</li>)}
                        </ol>
                      </div>
                    </div>
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
