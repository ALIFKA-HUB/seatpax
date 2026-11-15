import Link from 'next/link';
import PassengerShell from '@/app/components/passenger-shell';
import StatePanel from '@/app/components/state-panel';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {passengerServices} from '@/app/trips/data';
import HoldDetail from '../components/hold-detail';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function HoldPage({params}:{params:Promise<{holdId:string}>}){const {holdId}=await params,user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/holds/'+holdId));let initial;try{initial=await passengerServices().holds.readMine(user.id,holdId);}catch{} if(initial)return <PassengerShell active="search"><Link className="sp-back" href="/trips">← Cari perjalanan</Link><div className="sp-page-heading"><h1>Kursi Anda</h1></div><HoldDetail initial={initial}/></PassengerShell>;return <PassengerShell active="search"><StatePanel title="Hold tidak tersedia" action={<Link className="sp-primary" href="/trips">Cari perjalanan</Link>}>Hold hanya dapat dibuka oleh pemiliknya.</StatePanel></PassengerShell>;}

