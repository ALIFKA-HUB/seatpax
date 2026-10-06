'use client';
import {useActionState} from 'react';
import {logoutAction} from '@/app/login/actions';
export default function LogoutForm(){
 const [message,action,pending]=useActionState(async()=>{const result=await logoutAction();return result.ok?'':result.message;},'');
 return <form action={action}><button className="auth-primary" disabled={pending}>{pending?'Keluar…':'Keluar dari akun'}</button><p role="status" className="auth-message">{message}</p></form>;
}
