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
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Unirse a una Familia</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="inviteCode" style={{ display: 'block', marginBottom: '5px' }}>
            Código de invitación
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            maxLength={6}
            placeholder="ABC123"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', textTransform: 'uppercase' }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading ? 'Uniéndose...' : 'Unirse'}
        </button>
      </form>

      <p style={{ marginTop: '16px', textAlign: 'center' }}>
        ¿Tienes una familia nueva? <Link to="/register">Créala aquí</Link>
      </p>
    </div>
  );
};
