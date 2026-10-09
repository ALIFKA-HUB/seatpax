'use client';
import {useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import type {PassengerProfile} from '@/modules/boarding/types';
import type {SnackClaim} from '@/modules/snack/types';
import {createSubmissionGate} from '@/modules/boarding/ui-state';
import {claimSnackAction} from '../snack-actions';
import {wibTime} from './passenger-profile';
export default function SnackForm({tripId,profile,onClaimed}:{tripId:string;profile:PassengerProfile;onClaimed?:(claim:SnackClaim)=>void}){
 const router=useRouter(),gate=useRef(createSubmissionGate());const [pending,setPending]=useState(false),[message,setMessage]=useState(''),[record,setRecord]=useState<PassengerProfile['snack']>(null);const snack=record??profile.snack;
 function submit(event:FormEvent){event.preventDefault();if(!profile.boarding||snack)return;void gate.current.run(async()=>{setPending(true);setMessage('');try{const result=await claimSnackAction(tripId,{ticketId:profile.ticketId});if(!result.ok){setMessage(result.message);return;}setRecord({claimedAt:result.result.claim.claimedAt});onClaimed?.(result.result.claim);router.refresh();}catch{setMessage('Koneksi terputus. Coba lagi untuk memeriksa catatan yang sama.');}finally{setPending(false);}});}
 if(snack)return <div className="boarding-result" role="status"><strong>Snack sudah diserahkan</strong><p>{wibTime(snack.claimedAt)}</p></div>;
 return <form className="boarding-form" onSubmit={submit} aria-busy={pending}><strong>Snack belum diserahkan</strong>{!profile.boarding&&<p>Catat boarding dahulu sebelum menyerahkan snack.</p>}<button type="submit" disabled={pending||!profile.boarding}>{pending?'Mencatat…':'Serahkan snack'}</button><p role="status" aria-live="polite">{message}</p></form>;
}
