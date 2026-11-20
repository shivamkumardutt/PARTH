
import { useState } from 'react';
import './Auth.css';
import {
  loginUser,
  registerUser,
  getCurrentUser,
} from './services/authApi.js';

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [studentClass, setStudentClass] = useState('12');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (mode === 'register' && password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === 'register'
          ? await registerUser({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              role: role.toUpperCase(),
            })
          : await loginUser({
              email: email.trim().toLowerCase(),
              password,
            });

      const accessToken = result.accessToken;

      if (!accessToken) {
        throw new Error('Authentication token was not received.');
      }

      const profile = await getCurrentUser(accessToken);

      onAuthenticated({
        user: profile.user,
        accessToken,
      });
    } catch (err) {
      setError(
        err.message || 'Unable to authenticate. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <a className="auth-brand" href="/">PARTH<span>.</span></a>
        <span>LEARN. EXPLORE. CREATE. ACHIEVE.</span>
      </header>

      <section className="auth-layout">
        <div className="auth-story">
          <span className="auth-kicker">
            YOUR LEARNING JOURNEY STARTS HERE
          </span>

          <h1>
            A world of knowledge.<br />
            <span>One space.</span>
          </h1>

          <p>
            Discover a more connected way to learn, build skills
            and move closer to everything you want to achieve.
          </p>

          <div className="auth-manifesto">
            <span>LEARN WITH PURPOSE</span>
            <span>GROW WITH CONFIDENCE</span>
            <span>CREATE YOUR FUTURE</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <span className="auth-kicker">WELCOME TO PARTH</span>

            <h2>
              {mode === 'login'
                ? 'Welcome back.'
                : 'Create your account.'}
            </h2>

            <p>
              {mode === 'login'
                ? 'Sign in to continue your learning journey.'
                : 'A few details to get your learning space ready.'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              className={mode === 'login' ? 'selected' : ''}
              onClick={() => {
                setMode('login');
                setError('');
              }}
              type="button"
            >
              Log in
            </button>

            <button
              className={mode === 'register' ? 'selected' : ''}
              onClick={() => {
                setMode('register');
                setError('');
              }}
              type="button"
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label className="auth-label">FULL NAME</label>

                <input
                  className="auth-input"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />

                <label className="auth-label">I AM JOINING AS</label>

                <div className="role-options">
                  <button
                    type="button"
                    className={role === 'student' ? 'role-selected' : ''}
                    onClick={() => setRole('student')}
                  >
                    <span>◉</span>
                    <strong>Student</strong>
                    <small>Learn and grow</small>
                  </button>

                  <button
                    type="button"
                    className={role === 'parent' ? 'role-selected' : ''}
                    onClick={() => setRole('parent')}
                  >
                    <span>⌂</span>
                    <strong>Parent</strong>
                    <small>Support a learner</small>
                  </button>
                </div>

                {role === 'student' && (
                  <div className="auth-study-fields">
                    <div>
                      <label className="auth-label">
                        EDUCATION BOARD
                      </label>

                      <select
                        className="auth-input"
                        value={board}
                        onChange={event => setBoard(event.target.value)}
                      >
                        <option>CBSE</option>
                        <option>ICSE</option>
                        <option>State Board</option>
                      </select>
                    </div>

                    <div>
                      <label className="auth-label">CLASS</label>

                      <select
                        className="auth-input"
                        value={studentClass}
                        onChange={event =>
                          setStudentClass(event.target.value)
                        }
                      >
                        {Array.from(
                          { length: 12 },
                          (_, i) => String(i + 1)
                        ).map(value => (
                          <option key={value} value={value}>
                            Class {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <label className="auth-label">EMAIL ADDRESS</label>

            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <label className="auth-label">PASSWORD</label>

            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder={
                mode === 'register'
                  ? 'At least 8 characters'
                  : 'Enter your password'
              }
              autoComplete={
                mode === 'login'
                  ? 'current-password'
                  : 'new-password'
              }
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Continue to PARTH'
                  : 'Create my account'}

              <span>→</span>
            </button>
          </form>

          <p className="auth-legal">
            By continuing, you agree to PARTH's Terms of Service
            and Privacy Policy.
          </p>
        </div>
      </section>

      <footer className="auth-footer">
        <span>© 2026 PARTH</span>
        <span>MADE FOR CURIOUS MINDS.</span>
      </footer>
    </main>
  );
}
