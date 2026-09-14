'use client';
import { useState } from 'react';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function signIn(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(30000),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Sign-in failed.');
      window.location.assign('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in is unavailable.');
      setBusy(false);
    }
  }
  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        background: '#edf2e7',
        padding: 24,
      }}
    >
      <form
        onSubmit={signIn}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'white',
          padding: 32,
          borderRadius: 18,
          display: 'grid',
          gap: 18,
          color: '#153c2c',
        }}
      >
        <span>Aksen Workspace</span>
        <h1 style={{ fontSize: 32 }}>Welcome back.</h1>
        <p>Sign in to manage clients, projects and Lead Scout.</p>
        <label>
          Email
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: 'block',
              border: '1px solid #9cac9e',
              borderRadius: 8,
              padding: 12,
              width: '100%',
            }}
          />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            maxLength={200}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: 'block',
              border: '1px solid #9cac9e',
              borderRadius: 8,
              padding: 12,
              width: '100%',
            }}
          />
        </label>
        <button
          disabled={busy}
          style={{
            background: '#194b35',
            color: 'white',
            padding: 14,
            borderRadius: 8,
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
