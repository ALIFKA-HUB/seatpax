'use client';
import {useRef,useState,useTransition} from 'react';
import {resolvePaymentConflictAction} from '@/app/admin/payment-actions';
export default function PaymentConflictForm({companyId,bookingId,confirmDisabled,terminal}:{companyId:string;bookingId:string;confirmDisabled:boolean;terminal:boolean}){
 const [reason,setReason]=useState(''),[message,setMessage]=useState(''),[pending,start]=useTransition(),requestKeys=useRef<Partial<Record<'CONFIRM'|'MOCK_REFUND',string>>>({});
 function submit(action:'CONFIRM'|'MOCK_REFUND'){
  if(!reason.trim())return;
  const prompt=action==='CONFIRM'?'Konfirmasi kursi dan terbitkan tiket untuk pembayaran yang sudah PAID?':'Catat refund simulasi? Ini hanya catatan internal dan tidak memindahkan uang.';
  if(!window.confirm(prompt))return;
  const requestKey=requestKeys.current[action]??(requestKeys.current[action]=crypto.randomUUID());
  start(async()=>{const result=await resolvePaymentConflictAction(companyId,bookingId,{action,requestKey,reason});setMessage(result.ok?`Penyelesaian tersimpan: ${action==='CONFIRM'?'dikonfirmasi':'refund simulasi dicatat'}.`:result.message);if(result.ok)window.location.reload();});
 }
 return <section className="admin-panel"><h2>Penyelesaian pembayaran</h2><p className="admin-hint">Pembayaran sudah tercatat PAID. Refund simulasi hanya mencatat keputusan internal dan tidak memindahkan uang di Midtrans.</p><label>Alasan wajib<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} rows={4} required aria-describedby="payment-reason-hint"/></label><small id="payment-reason-hint">1–500 karakter. Catatan ini masuk audit.</small><div className="admin-buttons payment-resolution-buttons"><button type="button" className="admin-primary" disabled={confirmDisabled||terminal||pending||!reason.trim()} onClick={()=>submit('CONFIRM')}>Konfirmasi tiket</button><button type="button" className="admin-danger" disabled={terminal||pending||!reason.trim()} onClick={()=>submit('MOCK_REFUND')}>Catat refund simulasi</button></div><p className="admin-message" role="status" aria-live="polite">{pending?'Menyimpan…':message}</p></section>;
}
