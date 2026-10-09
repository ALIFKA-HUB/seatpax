'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {ManifestView,PassengerProfile as Profile} from '@/modules/boarding/types';
import {createScannerController} from '@/modules/boarding/scanner-controller';
import {resolveBoardingAction} from '../boarding-actions';
import PassengerProfile from './passenger-profile';
import BoardingForm from './boarding-form';
export default function TicketScanner({tripId,stops}:{tripId:string;stops:ManifestView['stops']}){
 const video=useRef<HTMLVideoElement>(null),mounted=useRef(true),controller=useRef<ReturnType<typeof createScannerController<Profile>>|null>(null);
 const [running,setRunning]=useState(false),[starting,setStarting]=useState(false),[message,setMessage]=useState(''),[profile,setProfile]=useState<Profile|null>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.close();};},[]);
 async function start(){if(starting||running)return;controller.current?.close();setProfile(null);setMessage('');setStarting(true);
  const next=createScannerController<Profile>({factory:async decoded=>{const {default:QrScanner}=await import('qr-scanner');if(!video.current)throw new Error('Camera view unavailable');return new QrScanner(video.current,result=>decoded(result.data),{preferredCamera:'environment',returnDetailedScanResult:true,highlightScanRegion:true});},resolve:async token=>{const result=await resolveBoardingAction(tripId,token);if(!result.ok)throw new Error('Ticket unavailable');return result.profile;},onResult:value=>{if(mounted.current&&controller.current===next){setProfile(value);setMessage('Tiket ditemukan. Periksa penumpang dan stop sebelum mencatat boarding.');}},onError:value=>{if(mounted.current&&controller.current===next)setMessage(value);},onRunning:value=>{if(mounted.current&&controller.current===next)setRunning(value);}});
  controller.current=next;await next.start();if(mounted.current&&controller.current===next)setStarting(false);
 }
 function close(){controller.current?.close();setRunning(false);setStarting(false);setMessage('Kamera ditutup.');}
 return <><p>Scan hanya membuka profil. Boarding tetap perlu dikonfirmasi.</p><video ref={video} className="boarding-camera" muted playsInline aria-label="Pratinjau kamera scanner"/><div className="boarding-camera-actions"><button onClick={()=>{void start();}} disabled={starting||running}>{starting?'Membuka kamera…':profile?'Scan tiket berikutnya':'Mulai / scan ulang'}</button><button onClick={close} disabled={!starting&&!running}>Tutup kamera</button><Link href={`/crew/trips/${tripId}/manifest`}>Cari di manifest →</Link></div><p role="status" aria-live="polite">{message}</p>{profile&&<><PassengerProfile profile={profile}/><BoardingForm key={profile.ticketId} tripId={tripId} profile={profile} stops={stops} source="QR" onBoarded={record=>setProfile({...profile,boarding:record})}/></>}</>;
}
