import { MailCheck } from '@/components/icons';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner } from '@/components/feedback/States';
import { Checkbox, TextField } from '@/components/forms/Fields';
import { BrandMark, DecisionGlimpse } from '@/components/illustrations/Illustrations';
import { Screen } from '@/components/layout/Screen';
import { useApp } from '@/hooks/useAppState';
import { mockHash } from '@/utils/id';
import { validateEmail, validateMobile, validatePassword, validateRequired } from '@/utils/validation';

export const MOCK_OTP = '123456';

// AUTH-01
export function AuthWelcome() {
  return (
    <Screen
      tone="ink"
      footer={
        <>
          <Link to="/auth/signup" className="btn block">Get started</Link>
          <Link to="/auth/login" className="btn ghost block">I already have an account</Link>
        </>
      }
    >
      <div className="stack-lg" style={{ paddingTop: 8 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="brand-mark"><BrandMark size={26} color="#06222b" /></span>
          <span className="strong" style={{ fontSize: 17 }}>Money Decision Engine</span>
        </div>
        <div className="reveal"><DecisionGlimpse /></div>
        <div className="stack">
          <h1 className="h1">Don't just track your money. Understand what to do with it.</h1>
          <p className="muted" style={{ fontSize: 16 }}>
            Bring your income, spending, savings and loans together. Explore what different choices would mean, compare the trade-offs and decide with confidence.
          </p>
        </div>
      </div>
    </Screen>
  );
}

// AUTH-02
export function AuthSignup() {
  const { actions } = useApp();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', mobile: '', password: '' });
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    name: validateRequired(f.name, 'Full name'),
    email: validateEmail(f.email),
    mobile: validateMobile(f.mobile),
    password: validatePassword(f.password),
    agree: agree ? null : 'Please accept the terms to continue.',
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);
  const submit = () => {
    setSubmitted(true);
    if (!valid) return;
    actions.signUp({ name: f.name.trim(), email: f.email.trim(), mobile: f.mobile.trim(), passwordHash: mockHash(f.password) });
    navigate('/auth/otp');
  };
  return (
    <Screen title="Create account" back="/auth/welcome" footer={<button className="btn block" onClick={submit}>Continue</button>}>
      <div className="stack">
        <p className="muted">We'll use this to secure your financial information.</p>
        <TextField label="Full name" value={f.name} onChange={(v) => setF({ ...f, name: v })} autoComplete="name" error={show('name')} />
        <TextField label="Email address" type="email" inputMode="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} autoComplete="email" error={show('email')} />
        <TextField label="Mobile number" inputMode="tel" placeholder="10-digit mobile" value={f.mobile} onChange={(v) => setF({ ...f, mobile: v.replace(/[^\d]/g, '').slice(0, 10) })} error={show('mobile')} help="An OTP will be sent to verify this number." />
        <TextField label="Password" type="password" value={f.password} onChange={(v) => setF({ ...f, password: v })} autoComplete="new-password" error={show('password')} help="At least 8 characters, including a number." />
        <Checkbox checked={agree} onChange={setAgree}>
          I agree to the <u>Terms of use</u> and <u>Privacy policy</u>, and understand this app does not provide regulated financial advice.
        </Checkbox>
        {show('agree') && <span className="error" style={{ color: 'var(--warn)', fontSize: 12 }}>{errors.agree}</span>}
        <p className="caption center">
          Already have an account? <Link to="/auth/login"><strong>Log in</strong></Link>
        </p>
      </div>
    </Screen>
  );
}

// AUTH-03
export function AuthLogin() {
  const { actions } = useApp();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const idErr = !id.trim() ? 'Enter your email or mobile number.' : id.includes('@') ? validateEmail(id) : validateMobile(id);
  const pwErr = pw ? null : 'Enter your password.';
  const submit = () => {
    setSubmitted(true);
    if (idErr || pwErr) return;
    actions.signIn(id.trim());
    navigate('/auth/otp');
  };
  return (
    <Screen title="Log in" back="/auth/welcome" footer={<button className="btn block" onClick={submit}>Continue</button>}>
      <div className="stack">
        <h2 className="h2">Welcome back</h2>
        <TextField label="Email or mobile" value={id} onChange={setId} autoComplete="username" error={submitted ? idErr : null} />
        <TextField label="Password" type="password" value={pw} onChange={setPw} autoComplete="current-password" error={submitted ? pwErr : null} />
        <Link to="/auth/recover" className="link-btn" style={{ alignSelf: 'flex-start' }}>Forgot password?</Link>
        <Banner tone="outline">Prototype: any valid email/mobile and password will log in. No real authentication happens.</Banner>
        <p className="caption center">
          New here? <Link to="/auth/signup"><strong>Create account</strong></Link>
        </p>
      </div>
    </Screen>
  );
}

// AUTH-04
export function AuthOtp() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const target = state.session.user?.mobile ? `+91 ••••• ${state.session.user.mobile.slice(-5)}` : state.session.user?.email ?? 'your mobile';
  const code = digits.join('');
  const verify = () => {
    if (code.length < 6) return setError('Enter the 6-digit code.');
    if (code !== MOCK_OTP) return setError('That code is incorrect. Try again or resend.');
    setError(null);
    setVerifying(true);
    setTimeout(() => {
      actions.verifyOtp();
      toast('Verified');
      navigate(state.onboarding.completed ? '/home' : `/onboarding/${state.onboarding.step}`, { replace: true });
    }, 600);
  };
  if (!state.session.user)
    return (
      <Screen title="Verify" back="/auth/welcome">
        <Banner tone="warn">No verification in progress. Please sign up or log in first.</Banner>
      </Screen>
    );
  return (
    <Screen title="Verify" back footer={<button className="btn block" disabled={verifying} onClick={verify}>{verifying ? 'Verifying…' : 'Verify'}</button>}>
      <div className="stack-lg">
        <div className="stack-sm">
          <h2 className="h2">Enter the code</h2>
          <p className="muted">We sent a 6-digit code to {target}.</p>
        </div>
        <div className="otp" role="group" aria-label="One-time password">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              value={d}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(-1);
                const next = [...digits];
                next[i] = v;
                setDigits(next);
                setError(null);
                if (v && i < 5) refs.current[i + 1]?.focus();
              }}
              onKeyDown={(e) => e.key === 'Backspace' && !digits[i] && i > 0 && refs.current[i - 1]?.focus()}
            />
          ))}
        </div>
        {error && <Banner tone="warn">{error}</Banner>}
        <div className="row-between">
          <span className="caption">{seconds > 0 ? `Resend code in ${seconds}s` : "Didn't get it?"}</span>
          <button
            className="link-btn"
            disabled={seconds > 0}
            style={{ opacity: seconds > 0 ? 0.4 : 1 }}
            onClick={() => {
              setSeconds(30);
              setDigits(Array(6).fill(''));
              toast('A new code has been sent');
            }}
          >
            Resend OTP
          </button>
        </div>
        <Banner tone="outline">Prototype: use code {MOCK_OTP}. No SMS is sent.</Banner>
      </div>
    </Screen>
  );
}

// AUTH-05
export function AuthRecover() {
  const [id, setId] = useState('');
  const [sent, setSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const err = !id.trim() ? 'Enter your email or mobile number.' : id.includes('@') ? validateEmail(id) : validateMobile(id);
  if (sent)
    return (
      <Screen title="Account recovery" back="/auth/login" footer={<Link to="/auth/login" className="btn block">Back to log in</Link>}>
        <div className="empty" style={{ paddingTop: 60 }}>
          <div className="ph"><MailCheck size={28} /></div>
          <h2 className="h2">Check your inbox</h2>
          <p className="muted">If an account exists for {id}, you'll receive instructions to reset your password.</p>
          <p className="caption">Prototype: no message is actually sent.</p>
        </div>
      </Screen>
    );
  return (
    <Screen
      title="Account recovery"
      back="/auth/login"
      footer={
        <button className="btn block" onClick={() => (setSubmitted(true), !err && setSent(true))}>
          Send recovery link
        </button>
      }
    >
      <div className="stack">
        <h2 className="h2">Forgot your password?</h2>
        <p className="muted">Enter the email or mobile number on your account.</p>
        <TextField label="Email or mobile" value={id} onChange={setId} error={submitted ? err : null} />
      </div>
    </Screen>
  );
}
