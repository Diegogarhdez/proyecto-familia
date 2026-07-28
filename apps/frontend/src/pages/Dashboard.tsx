import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Calendario familiar',
    description: 'Eventos, reuniones y recordatorios compartidos en un solo lugar.',
    accent: 'linear-gradient(135deg, #ffb36b 0%, #ff7a59 100%)',
    kind: 'feature' as const,
  },
  {
    title: 'Lista de la compra',
    description: 'Añade lo que falta en casa y tenlo a mano desde cualquier dispositivo.',
    accent: 'linear-gradient(135deg, #72d0c6 0%, #2fbf9e 100%)',
    kind: 'feature' as const,
  },
  {
    title: 'Rutinas semanales',
    description: 'Organiza tareas por días para que todo fluya mejor en familia.',
    accent: 'linear-gradient(135deg, #a58bff 0%, #6d5ef7 100%)',
    kind: 'feature' as const,
  },
  {
    title: 'Ideas y planes',
    description: 'Una zona para proponer salidas, actividades y planes del fin de semana.',
    accent: 'linear-gradient(135deg, #f7c46c 0%, #e39b3d 100%)',
    kind: 'feature' as const,
  },
  {
    title: 'Tareas pendientes',
    description: 'Un vistazo rápido a lo que queda por hacer hoy o durante la semana.',
    accent: 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)',
    kind: 'tasks' as const,
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

        if (!alive) return;

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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #ffb36b2e, transparent 32%), radial-gradient(circle at top right, #6d5ef729, transparent 28%), linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        color: 'white',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 18px',
            borderRadius: '18px',
            background: '#0f172ab8',
            border: '1px solid #94a3b82e',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 24px 60px #0f172a59',
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            style={{
              appearance: 'none',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '999px',
              background: '#f8717130',
              color: '#fecaca',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.95rem', color: 'lightgray' }}>Hola,</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{displayName}</div>

              {isAdmin && familyCode ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '6px',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: '#38bdf81f',
                    color: '#bae6fd',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ letterSpacing: '0.08em' }}>Código familia</span>
                  <span style={{ opacity: 0.9 }}>·</span>
                  <span style={{ fontFamily: 'monospace' }}>{familyCode}</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    marginTop: '6px',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: '#94a3b81f',
                    color: 'lightgray',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Código oculto para miembros
                </div>
              )}
            </div>

            <div
              aria-hidden="true"
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 10px 28px #60a5fa47',
                fontSize: '1.5rem',
              }}
            >
              👤
            </div>
          </div>
        </header>

        {error && (
          <section
            style={{
              padding: '16px 18px',
              borderRadius: '18px',
              background: '#7f1d1dcc',
              border: '1px solid #f8717147',
              color: '#fecaca',
            }}
          >
            {error}
          </section>
        )}

        <section
          style={{
            borderRadius: '24px',
            padding: '28px',
            background: 'linear-gradient(135deg, #0f172af2, #111827db)',
            border: '1px solid #94a3b829',
            boxShadow: '0 32px 70px #0f172a66',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                padding: '6px 10px',
                borderRadius: '999px',
                background: '#f973161f',
                color: '#fdba74',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Dashboard familiar
            </span>
            <h1 style={{ margin: 0, fontSize: '2.3rem', lineHeight: 1.05 }}>
              {isLoading ? 'Cargando tu espacio familiar...' : 'Todo lo importante de la familia, en un mismo sitio.'}
            </h1>
            <p style={{ margin: 0, color: 'lightgray', maxWidth: '680px', fontSize: '1.02rem' }}>
              {isLoading
                ? 'Estamos trayendo tu nombre real, tu familia y tus permisos desde el servidor.'
                : 'Aquí tendrás acceso visual a las herramientas principales. Aún no están conectadas, pero esta es la base para organizar la vida familiar de una forma clara y agradable.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {(isLoading ? features.slice(0, 2) : features).map((feature) => (
              <article
                key={feature.title}
                style={{
                  minHeight: '190px',
                  padding: '18px',
                  borderRadius: '18px',
                  background: 'linear-gradient(180deg, #1e293bf2, #0f172af5)',
                  border: '1px solid #94a3b824',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: feature.accent,
                    }}
                  />
                  <h2 style={{ margin: '14px 0 8px', fontSize: '1.15rem' }}>{feature.title}</h2>
                  {feature.kind === 'tasks' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        'Añadir la compra de esta semana',
                        'Revisar eventos del calendario familiar',
                        'Asignar quién recoge a los niños',
                        'Preparar la lista de tareas del fin de semana',
                      ].map((task) => (
                        <div
                          key={task}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 0',
                            borderBottom: '1px solid #334155',
                          }}
                        >
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: '#f59e0b',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: 'lightgray', lineHeight: 1.4 }}>{task}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: 'lightgray', lineHeight: 1.5 }}>{feature.description}</p>
                  )}
                </div>
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: '#ffffff10',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                  }}
                >
                  Próximamente
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div
            style={{
              padding: '18px',
              borderRadius: '18px',
              background: '#0f172ab8',
              border: '1px solid #94a3b824',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#93c5fd' }}>Familia activa</div>
            <div style={{ marginTop: '6px', fontSize: '1.2rem', fontWeight: 700 }}>{familyName}</div>
          </div>

          <div
            style={{
              padding: '18px',
              borderRadius: '18px',
              background: '#0f172ab8',
              border: '1px solid #94a3b824',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#86efac' }}>Estado</div>
            <div style={{ marginTop: '6px', fontSize: '1.2rem', fontWeight: 700 }}>
              {profile?.role === 'ADMIN' ? 'Eres administrador de la familia' : 'Miembro de la familia'}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
