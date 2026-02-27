import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GlowField } from './GlowField';
import NetworkBackground from './NetworkBackground';
import { authApi } from './api';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  box:      '#1E1E1E',
  boxAlt:   '#252525',
  border:   '#383838',
  primary:  '#8E6BDF',
  txtPrim:  '#E3E3E3',
  txtSec:   '#9E9E9E',
  txtMuted: '#616161',
  outerBg:  '#06060F',
};

// ─── Login page ────────────────────────────────────────────────────────────────
const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focused, setFocused]   = useState<string | null>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.username.trim()) e.username = 'Username or email is required.';
    if (!form.password)        e.password = 'Password is required.';
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await authApi.login({ username: form.username, password: form.password });
      if (res.token) {
        localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
        navigate('/profile');
      } else {
        setApiError(res.message || 'Login failed. Please try again.');
      }
    } catch {
      setApiError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string, hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    paddingLeft: 44,
    paddingRight: field === 'password' ? 44 : 16,
    paddingTop: 13,
    paddingBottom: 13,
    background: hasError ? 'rgba(231,76,60,0.08)' : C.boxAlt,
    border: `1.6px solid ${hasError ? '#E74C3C' : focused === field ? C.primary : C.border}`,
    borderRadius: 12,
    color: C.txtPrim,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    boxShadow: focused === field && !hasError
      ? '0 0 0 3px rgba(142,107,223,0.18), 0 0 18px rgba(142,107,223,0.12)'
      : 'none',
  });

  const Icon = ({ path, path2 }: { path: string; path2?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d={path} />
      {path2 && <path d={path2} />}
    </svg>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: C.outerBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: 'relative',
    }}>
      {/* Animated background */}
      <NetworkBackground />

      {/* Content */}
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* Card */}
        <div style={{
          background: 'rgba(30,30,30,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid rgba(56,56,56,0.8)`,
          borderRadius: 24,
          padding: '36px 32px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 8px 40px rgba(142,107,223,0.1)',
        }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 4, height: 22, borderRadius: 2,
                background: 'linear-gradient(180deg, #6A4CC7 0%, #8E6BDF 100%)',
                boxShadow: '0 0 8px rgba(142,107,223,0.55)',
              }} />
              <h2 style={{ color: C.txtPrim, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
                Welcome back
              </h2>
            </div>
            <p style={{ color: C.txtSec, fontSize: 13, margin: '0 0 0 14px' }}>
              Sign in to your professional network
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: C.txtSec, fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Username or Email
              </label>
              <GlowField value={form.username} focused={focused === 'username'}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: focused === 'username' ? C.primary : C.txtMuted, pointerEvents: 'none', display: 'flex', transition: 'color 0.18s' }}>
                    <Icon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" path2="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  </span>
                  <input
                    name="username" type="text" autoComplete="username"
                    value={form.username} onChange={handleChange}
                    onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
                    placeholder="johndoe or john@example.com"
                    style={inputStyle('username', !!errors.username)}
                  />
                </div>
              </GlowField>
              {errors.username && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E74C3C', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13, flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ color: C.txtSec, fontSize: 12, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  Password
                </label>
                <a href="#" style={{ color: C.primary, fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                  Forgot?
                </a>
              </div>
              <GlowField value={form.password} focused={focused === 'password'}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: focused === 'password' ? C.primary : C.txtMuted, pointerEvents: 'none', display: 'flex', transition: 'color 0.18s' }}>
                    <Icon path="M12 17v2m-6 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" path2="M18 9V7a6 6 0 0 0-12 0v2" />
                  </span>
                  <input
                    name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                    value={form.password} onChange={handleChange}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    placeholder="Enter your password"
                    style={inputStyle('password', !!errors.password)}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.txtMuted, display: 'flex', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.txtSec)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.txtMuted)}
                  >
                    {showPw
                      ? <Icon path="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" />
                      : <Icon path="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" path2="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    }
                  </button>
                </div>
              </GlowField>
              {errors.password && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E74C3C', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13, flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22, marginTop: 4 }}>
              <button type="button" onClick={() => setRemember(v => !v)}
                style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `1.8px solid ${remember ? C.primary : C.border}`,
                  background: remember ? C.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {remember && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span style={{ color: C.txtSec, fontSize: 13, cursor: 'pointer', userSelect: 'none' }} onClick={() => setRemember(v => !v)}>
                Keep me signed in
              </span>
            </div>

            {/* API error banner */}
            {apiError && (
              <div style={{
                marginBottom: 14, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.35)',
                color: '#E74C3C', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15, flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {apiError}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #5039B8 0%, #7B54D4 50%, #8E6BDF 100%)',
                color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(142,107,223,0.45)',
                opacity: loading ? 0.75 : 1,
                transition: 'box-shadow 0.2s, opacity 0.2s',
              }}
            >
              {loading ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ color: C.txtMuted, fontSize: 11, fontWeight: 600, letterSpacing: '0.5px' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            {/* Sign up link */}
            <p style={{ textAlign: 'center', color: C.txtSec, fontSize: 13, margin: 0 }}>
              New to Prok?{' '}
              <Link to="/signup" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>
                Create a free account
              </Link>
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: C.txtMuted, fontSize: 11, marginTop: 20, position: 'relative', zIndex: 1 }}>
          Trusted by 10,000+ professionals worldwide
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #616161; }
      `}</style>
    </div>
  );
};

export default Login;
