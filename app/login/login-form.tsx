'use client';
import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react';
import { sendOtpAction, verifyOtpAction } from './actions';
import { EMAIL_OTP_LENGTH, type AuthResult } from '@/modules/auth/service';
import { initialLoginState, loginReducer } from '@/modules/auth/login-state';

const networkFailure: AuthResult = { ok: false, code: 'provider_unavailable', message: 'Koneksi terputus. Coba lagi sebentar.' };
export default function LoginForm({next="/account"}:{next?:string}) {
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
    } catch { dispatch({ type: 'requestResult', id, email, result: networkFailure, now: Date.now() }); }
    finally { busy.current = false; }
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || state.pending) return;
    busy.current = true;
    const id = state.requestId + 1;
    dispatch({ type: 'startVerify' });
    try { dispatch({ type: 'verifyResult', id, result: await verifyOtpAction({ email: state.email, token }, next) }); }
    catch { dispatch({ type: 'verifyResult', id, result: networkFailure }); }
    finally { busy.current = false; }
  }
  return <>
    {state.stage === 'email' ? <form onSubmit={event => { event.preventDefault(); void send(); }}>
      <label htmlFor="email">Alamat email</label>
      <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required value={state.email} disabled={state.pending} onChange={event => dispatch({ type: 'editEmail', email: event.target.value })} placeholder="nama@email.com" aria-describedby="login-message" />
      <button className="auth-primary" disabled={state.pending} type="submit">{state.pending ? 'Mengirim kode…' : 'Kirim kode masuk'}</button>
    </form> : <>
      <p className="auth-destination">Periksa email <strong>{state.email.trim()}</strong> untuk kode masuk Anda.</p>
      <form onSubmit={verify}>
        <label htmlFor="otp">Kode {EMAIL_OTP_LENGTH} digit</label>
        <input ref={codeInput} id="otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern={`[0-9]{${EMAIL_OTP_LENGTH}}`} maxLength={EMAIL_OTP_LENGTH} required value={token} disabled={state.pending} onChange={event => setToken(event.target.value)} aria-describedby="login-message" className="auth-code" />
        <button className="auth-primary" disabled={state.pending} type="submit">{state.pending ? 'Memproses…' : 'Verifikasi dan masuk'}</button>
      </form>
      <div className="auth-secondary">
        <button type="button" disabled={state.pending || seconds > 0} onClick={() => { setToken(''); void send(); }}>{seconds > 0 ? `Kirim ulang dalam ${seconds} dtk` : 'Kirim ulang kode'}</button>
        <button type="button" disabled={state.pending} onClick={() => { setToken(''); dispatch({ type: 'reset' }); }}>Ganti email</button>
      </div>
    </>}
    <p id="login-message" role="status" aria-live="polite" className="auth-message">{state.message || (state.pending ? 'Permintaan sedang diproses.' : '')}</p>
  </>;
}
