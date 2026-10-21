'use client';

import Link from 'next/link';
import {useEffect,useRef,useState,useTransition} from 'react';
import {CaretDown,SignOut,UserCircle} from '@phosphor-icons/react';
import {createBrowserSupabaseClient} from '@/lib/supabase/browser';

type Status='unknown'|'guest'|'signed-in';
type Props={status:Status;pending:boolean;message:string;onLogout:()=>void};

export function AccountControl({status,pending,message,onLogout}:Props){
 const disclosure=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  if(status!=='signed-in')return;
  function outside(event:PointerEvent){if(event.target instanceof Node&&!disclosure.current?.contains(event.target)&&disclosure.current)disclosure.current.open=false;}
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[status]);
 if(status!=='signed-in')return <Link className={`sp-account-trigger${status==='guest'?' sp-account-login':''}`} href={status==='guest'?'/login':'/account'}>{status==='guest'?'Masuk':'Akun'}</Link>;
 return <details className="sp-account-disclosure" ref={disclosure} onKeyDown={event=>{
  if(event.key==='Escape'&&disclosure.current){disclosure.current.open=false;disclosure.current.querySelector('summary')?.focus();}
 }} onBlur={event=>{if(event.relatedTarget instanceof Node&&!event.currentTarget.contains(event.relatedTarget))event.currentTarget.open=false;}}>
  <summary className="sp-account-trigger"><UserCircle size={19} aria-hidden="true"/>Akun<CaretDown size={13} aria-hidden="true"/></summary>
  <div className="sp-account-popover"><Link href="/account" onClick={()=>{if(disclosure.current)disclosure.current.open=false;}}><UserCircle size={18} aria-hidden="true"/>Profil saya</Link><button type="button" onClick={onLogout} disabled={pending}><SignOut size={18} aria-hidden="true"/>{pending?'Keluar…':'Keluar'}</button>{message&&<p className="sp-menu-error" role="status">{message}</p>}</div>
 </details>;
}

export default function PassengerAccountMenu(){
 const [status,setStatus]=useState<Status>('unknown');
 const [message,setMessage]=useState('');
 const [pending,startTransition]=useTransition();
 useEffect(()=>{
  let alive=true,generation=0,timer:ReturnType<typeof setTimeout>|undefined;
  let client:ReturnType<typeof createBrowserSupabaseClient>;
  try{client=createBrowserSupabaseClient();}catch{return;}
  async function refresh(){
   if(!alive)return;
   const request=++generation;
   try{
    const {data,error}=await client.auth.getUser();
    if(alive&&request===generation)setStatus(error&&error.name!=='AuthSessionMissingError'?'unknown':data.user?'signed-in':'guest');
   }catch{if(alive&&request===generation)setStatus('unknown');}
  }
  void refresh();
  const {data:{subscription}}=client.auth.onAuthStateChange(event=>{
   if(!alive)return;
   if(event==='SIGNED_OUT'){generation++;setStatus('guest');}
   else if(event!=='INITIAL_SESSION'){clearTimeout(timer);timer=setTimeout(()=>{void refresh();},0);}
  });
  return()=>{alive=false;generation++;clearTimeout(timer);subscription.unsubscribe();};
 },[]);
 function logout(){
  setMessage('');
  startTransition(async()=>{
   try{
    const {logoutAction}=await import('@/app/login/actions');
    const result=await logoutAction();
    if(!result.ok)setMessage(result.message);
   }catch{setMessage('Belum bisa keluar. Coba lagi.');}
  });
 }
 return <AccountControl status={status} pending={pending} message={message} onLogout={logout}/>;
}
