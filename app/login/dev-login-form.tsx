'use client';
import {useActionState} from 'react';
import {quickLoginAction} from './dev-actions';

export default function DevLoginForm({accounts,next}:{accounts:readonly {id:string;label:string;email:string}[];next?:string}){
 const [state,action,pending]=useActionState(quickLoginAction,{message:''});
 return <form action={action}>
  <label htmlFor="testing-account">Akun testing</label>
  <select id="testing-account" name="account" defaultValue="customer" disabled={pending} required>{accounts.map(a=><option key={a.id} value={a.id}>{a.label} | {a.email}</option>)}</select>
  {next&&<input type="hidden" name="next" value={next}/>}
  <button type="submit" className="auth-primary" disabled={pending}>{pending?'Membuka akun...':'Masuk tanpa OTP'}</button>
  <p role="status" aria-live="polite" className="auth-message">{state.message}</p>
 </form>;
}
