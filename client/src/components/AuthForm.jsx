import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = isRegister
        ? { username, email, password }
        : { email, password };
      const url = isRegister ? '/auth/register' : '/auth/login';
      const { data } = await api.post(url, payload);
      login(data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-4">
        {isRegister ? 'Create your account' : 'Welcome back'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-medium py-2 rounded"
        >
          {loading
            ? isRegister
              ? 'Creating account…'
              : 'Signing in…'
            : isRegister
            ? 'Create account'
            : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-4 text-center">
        {isRegister ? (
          <>
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
