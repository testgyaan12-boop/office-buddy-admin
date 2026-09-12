import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-blue-500 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">OfficeBuddy Admin</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in with an admin account</p>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-slate-600">Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="mb-5 block text-sm">
          <span className="mb-1 block text-slate-600">Password</span>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-lg leading-none text-slate-500 hover:text-slate-800"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </label>
        <button disabled={loading} className="w-full rounded-lg bg-violet-600 py-2.5 text-white hover:bg-violet-700 disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
