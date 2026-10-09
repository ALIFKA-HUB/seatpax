import Link from 'next/link';
import PassengerShell from '@/app/components/passenger-shell';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {passengerServices} from '@/app/trips/data';
import HoldDetail from '../components/hold-detail';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function HoldPage({params}:{params:Promise<{holdId:string}>}){const {holdId}=await params,user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/holds/'+holdId));let initial;try{initial=await passengerServices().holds.readMine(user.id,holdId);}catch{} if(initial)return <PassengerShell active="search"><Link href="/trips">← Cari perjalanan</Link><h1>Kursi Anda</h1><HoldDetail initial={initial}/></PassengerShell>;return <PassengerShell active="search"><h1>Hold tidak tersedia</h1><p>Hold hanya dapat dibuka oleh pemiliknya.</p><Link href="/trips">Cari perjalanan</Link></PassengerShell>;}

