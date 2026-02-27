import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GlowField } from './GlowField';
import NetworkBackground from './NetworkBackground';
import { authApi } from './api';

// ─── Design tokens (from SpendTrack AppTheme) ──────────────────────────────────
const C = {
  bg:       '#121212',
  box:      '#1E1E1E',
  boxAlt:   '#252525',
  border:   '#383838',
  primary:  '#8E6BDF',
  income:   '#2CC36B',
  expense:  '#E74C3C',
  txtPrim:  '#E3E3E3',
  txtSec:   '#9E9E9E',
  txtMuted: '#616161',
  outerBg:  '#06060F',
};

// ─── Password strength ─────────────────────────────────────────────────────────
type Strength = 'none' | 'weak' | 'medium' | 'strong';
function getStrength(pw: string): Strength {
  if (!pw) return 'none';
  let score = 0;
  if (pw.length >= 8)             score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  if (score <= 1) return 'weak';
  if (score <= 2) return 'medium';
  return 'strong';
}
const STR_CFG: Record<Strength, { label: string; color: string; bars: number }> = {
  none:   { label: '',        color: '#383838', bars: 0 },
  weak:   { label: 'Weak',   color: '#E74C3C', bars: 1 },
  medium: { label: 'Medium', color: '#F59E0B', bars: 2 },
  strong: { label: 'Strong', color: '#2CC36B', bars: 3 },
};

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', password:'', confirm:'' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const strength   = getStrength(form.password);
  const strCfg     = STR_CFG[strength];
  const pwsMatch   = form.confirm && form.confirm === form.password;

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.username.trim())        e.username = 'Username is required.';
    else if (form.username.length < 3) e.username = 'Min. 3 characters.';
    if (!form.email.trim())            e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)                e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Min. 8 characters.';
    if (!form.confirm)                 e.confirm = 'Please confirm your password.';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
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
      const res = await authApi.signup({
        username: form.username,
        email:    form.email,
        password: form.password,
      });
      if (res.token) {
        localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
        navigate('/profile');
      } else {
        setApiError(res.message || 'Sign up failed. Please try again.');
      }
    } catch {
      setApiError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input style ──────────────────────────────────────────────────────
  const inputStyle = (field: string, hasError?: boolean, isSuccess?: boolean): React.CSSProperties => ({
    width: '100%',
    paddingLeft: 44,
    paddingRight: ['password','confirm'].includes(field) ? 44 : 16,
    paddingTop: 13,
    paddingBottom: 13,
    background: hasError ? 'rgba(231,76,60,0.08)' : isSuccess ? 'rgba(44,195,107,0.06)' : C.boxAlt,
    border: `1.6px solid ${hasError ? '#E74C3C' : isSuccess ? '#2CC36B' : focused === field ? C.primary : C.border}`,
    borderRadius: 12,
    color: C.txtPrim,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    boxShadow: focused === field && !hasError && !isSuccess
      ? '0 0 0 3px rgba(142,107,223,0.18), 0 0 18px rgba(142,107,223,0.12)'
      : isSuccess
      ? '0 0 0 2px rgba(44,195,107,0.12)'
      : 'none',
  });

  const Icon = ({ path, path2 }: { path: string; path2?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d={path} />
      {path2 && <path d={path2} />}
    </svg>
  );

  const EyeOpen  = () => <Icon path="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" path2="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />;
  const EyeOff   = () => <Icon path="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" />;

  const ErrMsg = ({ msg }: { msg?: string }) => msg ? (
    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E74C3C', display: 'flex', alignItems: 'center', gap: 5 }}>
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13, flexShrink: 0 }}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  ) : null;

  const iconColor = (field: string) => focused === field ? C.primary : C.txtMuted;

  return (
    <div style={{ minHeight: '100vh', background: C.outerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: '24px 16px', position: 'relative' }}>
      <NetworkBackground />
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Card */}
        <div style={{
          background: 'rgba(30,30,30,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(56,56,56,0.8)',
          borderRadius: 24,
          padding: '36px 32px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 8px 40px rgba(142,107,223,0.1)',
        }}>

          {/* Logo + header */}
          <div style={{ marginBottom: 26 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 4, height: 22, borderRadius: 2,
                background: 'linear-gradient(180deg, #6A4CC7 0%, #8E6BDF 100%)',
                boxShadow: '0 0 8px rgba(142,107,223,0.55)',
              }} />
              <h2 style={{ color: C.txtPrim, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
                Create account
              </h2>
            </div>
            <p style={{ color: C.txtSec, fontSize: 13, margin: '0 0 0 14px' }}>
              Join your professional network for free
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Username */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: C.txtSec, fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Username</label>
              <GlowField value={form.username} focused={focused === 'username'}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: iconColor('username'), pointerEvents: 'none', display: 'flex', transition: 'color 0.18s' }}>
                    <Icon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" path2="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  </span>
                  <input name="username" type="text" autoComplete="username" value={form.username} onChange={handleChange}
                    onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
                    placeholder="johndoe" style={inputStyle('username', !!errors.username)} />
                </div>
              </GlowField>
              <ErrMsg msg={errors.username} />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: C.txtSec, fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Email Address</label>
              <GlowField value={form.email} focused={focused === 'email'}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: iconColor('email'), pointerEvents: 'none', display: 'flex', transition: 'color 0.18s' }}>
                    <Icon path="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                  </span>
                  <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    placeholder="john@example.com" style={inputStyle('email', !!errors.email)} />
                </div>
              </GlowField>
              <ErrMsg msg={errors.email} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: C.txtSec, fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Password</label>
              <GlowField value={form.password} focused={focused === 'password'}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: iconColor('password'), pointerEvents: 'none', display: 'flex', transition: 'color 0.18s' }}>
                    <Icon path="M12 17v2m-6 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" path2="M18 9V7a6 6 0 0 0-12 0v2" />
                  </span>
                  <input name="password" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={handleChange}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    placeholder="Min. 8 characters" style={inputStyle('password', !!errors.password)} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.txtMuted, display: 'flex' }}>
                    {showPw ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </GlowField>
              {errors.password && <ErrMsg msg={errors.password} />}

              {/* Strength bar */}
              {form.password && !errors.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
                    {[1,2,3].map(bar => (
                      <div key={bar} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: strCfg.bars >= bar ? strCfg.color : C.border,
                        transition: 'background 0.25s',
                        boxShadow: strCfg.bars >= bar ? `0 0 6px ${strCfg.color}66` : 'none',
                      }} />
                    ))}
                  </div>
                  {strCfg.label && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: strCfg.color, letterSpacing: '0.2px' }}>
                      {strCfg.label} password
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: C.txtSec, fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Confirm Password</label>
              <GlowField value={form.confirm} focused={focused === 'confirm'}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: pwsMatch ? C.income : iconColor('confirm'), pointerEvents: 'none', display: 'flex', transition: 'color 0.18s' }}>
                    <Icon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </span>
                  <input name="confirm" type={showCf ? 'text' : 'password'} autoComplete="new-password" value={form.confirm} onChange={handleChange}
                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                    placeholder="Re-enter your password"
                    style={inputStyle('confirm', !!errors.confirm, !!pwsMatch)} />
                  <button type="button" onClick={() => setShowCf(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.txtMuted, display: 'flex' }}>
                    {showCf ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </GlowField>
              {pwsMatch && !errors.confirm && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: C.income, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Passwords match
                </p>
              )}
              <ErrMsg msg={errors.confirm} />
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 20 }}>
              <button type="button" onClick={() => setAgreed(v => !v)}
                style={{
                  width: 18, height: 18, borderRadius: 5, border: `1.8px solid ${agreed ? C.primary : C.border}`,
                  background: agreed ? C.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, transition: 'all 0.15s', flexShrink: 0, marginTop: 1,
                }}
              >
                {agreed && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <p style={{ color: C.txtSec, fontSize: 12, margin: 0, lineHeight: 1.55, userSelect: 'none', cursor: 'pointer' }} onClick={() => setAgreed(v => !v)}>
                I agree to the{' '}
                <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>Terms of Service</a>
                {' '}and{' '}
                <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>Privacy Policy</a>
              </p>
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
            <button
              type="submit"
              disabled={loading || !agreed}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 12,
                border: 'none',
                cursor: loading || !agreed ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #5039B8 0%, #7B54D4 50%, #8E6BDF 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: loading || !agreed ? 'none' : '0 4px 20px rgba(142,107,223,0.45)',
                opacity: loading || !agreed ? 0.55 : 1,
                transition: 'box-shadow 0.2s, opacity 0.2s',
              }}
            >
              {loading ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  Create Free Account
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

            {/* Login link */}
            <p style={{ textAlign: 'center', color: C.txtSec, fontSize: 13, margin: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: C.txtMuted, fontSize: 11, marginTop: 20 }}>
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

export default Signup;
