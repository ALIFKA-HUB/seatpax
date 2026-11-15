'use client';
import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react';
import { ArrowClockwise, ArrowLeft, ArrowRight, EnvelopeSimple, Key } from '@phosphor-icons/react';
import { sendOtpAction, verifyOtpAction } from './actions';
import { EMAIL_OTP_LENGTH, type AuthResult } from '@/modules/auth/service';
import { initialLoginState, loginReducer } from '@/modules/auth/login-state';

const networkFailure: AuthResult = { ok: false, code: 'provider_unavailable', message: 'Koneksi terputus. Coba lagi sebentar.' };

export default function LoginForm({ next }: { next?: string }) {
  const [state, dispatch] = useReducer(loginReducer, initialLoginState);
  const [token, setToken] = useState('');
  const [now, setNow] = useState(0);
  const busy = useRef(false);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.stage !== 'code') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    codeInput.current?.focus();
    return () => clearInterval(timer);
  }, [state.stage]);

  const seconds = Math.max(0, Math.ceil((state.resendAt - now) / 1000));
  const statusText = state.message || (state.pending ? 'Permintaan sedang diproses.' : '');
  const statusTone = state.message ? 'error' : state.pending ? 'pending' : 'idle';

  async function send() {
    const timestamp = Date.now();
    if (busy.current || state.pending || timestamp < state.resendAt) return;
    busy.current = true;
    const id = state.requestId + 1;
    const email = state.email;
    dispatch({ type: 'startRequest', now: timestamp });
    try {
      const result = await sendOtpAction(email);
      const completedAt = Date.now();
      setNow(completedAt);
      dispatch({ type: 'requestResult', id, email, result, now: completedAt });
    } catch {
      dispatch({ type: 'requestResult', id, email, result: networkFailure, now: Date.now() });
    } finally {
      busy.current = false;
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || state.pending) return;
    busy.current = true;
    const id = state.requestId + 1;
    dispatch({ type: 'startVerify' });
    try {
      dispatch({ type: 'verifyResult', id, result: await verifyOtpAction({ email: state.email, token }, next) });
    } catch {
      dispatch({ type: 'verifyResult', id, result: networkFailure });
    } finally {
      busy.current = false;
    }
  }

  return (
    <>
      <p className="lg-step-pill">
        {state.stage === 'email' ? 'Langkah 1 dari 2 · Email' : `Langkah 2 dari 2 · Kode ${EMAIL_OTP_LENGTH} digit`}
      </p>
      <h1 id="login-title">{state.stage === 'email' ? 'Masuk ke Seatpax' : 'Masukkan kode masuk'}</h1>
      <p className="lg-intro">
        {state.stage === 'email'
          ? `Kami akan mengirimkan kode verifikasi ${EMAIL_OTP_LENGTH} digit ke email Anda. Tanpa perlu kata sandi.`
          : 'Masukkan kode yang baru kami kirim ke kotak masuk email Anda.'}
      </p>

      {state.stage === 'email' ? (
        <form
          className="lg-form"
          onSubmit={event => {
            event.preventDefault();
            void send();
          }}
        >
          <div className="lg-field">
            <label htmlFor="email">Alamat email</label>
            <div className="lg-input-box">
              <span className="lg-input-icon" aria-hidden="true">
                <EnvelopeSimple size={18} weight="regular" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={state.email}
                disabled={state.pending}
                onChange={event => dispatch({ type: 'editEmail', email: event.target.value })}
                placeholder="nama@email.com"
                aria-describedby="login-message"
              />
            </div>
          </div>
          <button className="lg-primary auth-primary" disabled={state.pending} type="submit">
            <span>{state.pending ? 'Mengirim kode…' : 'Kirim kode masuk'}</span>
            {!state.pending && <ArrowRight size={18} weight="bold" aria-hidden="true" />}
          </button>
        </form>
      ) : (
        <>
          <div className="lg-destination-box">
            <EnvelopeSimple size={18} weight="regular" aria-hidden="true" />
            <p>
              Periksa email <strong>{state.email.trim()}</strong> untuk kode masuk Anda.
            </p>
          </div>
          <form className="lg-form" onSubmit={verify}>
            <div className="lg-field">
              <label htmlFor="otp">Kode {EMAIL_OTP_LENGTH} digit</label>
              <div className="lg-input-box">
                <span className="lg-input-icon" aria-hidden="true">
                  <Key size={18} weight="regular" />
                </span>
                <input
                  ref={codeInput}
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern={`[0-9]{${EMAIL_OTP_LENGTH}}`}
                  maxLength={EMAIL_OTP_LENGTH}
                  required
                  value={token}
                  disabled={state.pending}
                  onChange={event => setToken(event.target.value)}
                  placeholder={'•'.repeat(EMAIL_OTP_LENGTH)}
                  aria-describedby="login-message"
                  className="lg-code-input auth-code"
                />
              </div>
            </div>
            <button className="lg-primary auth-primary" disabled={state.pending} type="submit">
              <span>{state.pending ? 'Memproses…' : 'Verifikasi dan masuk'}</span>
              {!state.pending && <ArrowRight size={18} weight="bold" aria-hidden="true" />}
            </button>
          </form>
          <div className="lg-secondary-row auth-secondary">
            <button
              type="button"
              className="lg-text-btn"
              disabled={state.pending || seconds > 0}
              onClick={() => {
                setToken('');
                void send();
              }}
            >
              <ArrowClockwise size={15} weight="bold" aria-hidden="true" />
              <span>{seconds > 0 ? `Kirim ulang dalam ${seconds} dtk` : 'Kirim ulang kode'}</span>
            </button>
            <button
              type="button"
              className="lg-text-btn"
              disabled={state.pending}
              onClick={() => {
                setToken('');
                dispatch({ type: 'reset' });
              }}
            >
              <ArrowLeft size={15} weight="bold" aria-hidden="true" />
              <span>Ganti email</span>
            </button>
          </div>
        </>
      )}

      <p id="login-message" role="status" aria-live="polite" className="auth-message lg-status" data-tone={statusTone}>
        {statusText}
      </p>
    </>
  );
}
