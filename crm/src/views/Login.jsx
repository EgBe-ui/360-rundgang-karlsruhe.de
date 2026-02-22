import { useState } from 'preact/hooks';
import { useAuth } from '../lib/auth.jsx';

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Ungueltige Anmeldedaten'
        : err.message);
    }
    setLoading(false);
  }

  return (
    <div class="login-page">
      <form class="login-card" onSubmit={handleSubmit}>
        <div class="login-title">Beck360 CRM</div>
        <div class="login-subtitle">Anmelden</div>

        {error && <div class="login-error">{error}</div>}

        <div class="form-group">
          <label for="login-email">E-Mail</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onInput={(e) => setEmail(e.target.value)}
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="login-password">Passwort</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
            required
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          style="width: 100%; justify-content: center"
          disabled={loading}
        >
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>
    </div>
  );
}
