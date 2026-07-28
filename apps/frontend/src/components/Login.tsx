import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario
import { apiClient } from '../api/client'; // Ajusta la ruta si es necesario

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    setError(null);
    setIsLoading(true);

    try {
      // 1. Enviamos las credenciales al backend
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      // 2. Extraemos el token que fabricó NestJS
      const accessToken = response.data.accessToken ?? response.data.access_token;

      if (!accessToken) {
        throw new Error('El backend no devolvió un token');
      }

      // 3. Lo guardamos en nuestro estado global (lo que a su vez lo guarda en localStorage)
      login(accessToken);

      // 4. Redirigimos al usuario a una página protegida (por ejemplo, al Dashboard)
      navigate('/dashboard', { replace: true });
      
    } catch (err: any) {
      // Si el backend devuelve un 401, lo capturamos aquí
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
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Iniciar Sesión</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Correo Electrónico</label>
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
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading ? 'Cargando...' : 'Entrar'}
        </button>
      </form>

      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
      <p style={{ marginTop: '8px', textAlign: 'center' }}>
        ¿Tienes un código de invitación? <Link to="/join">Únete aquí</Link>
      </p>
    </div>
  );
};
