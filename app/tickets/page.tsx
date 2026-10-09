import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {ticketsData} from './data';
import PassengerShell from '../components/passenger-shell';
import StatePanel from '../components/state-panel';
import TicketCard from '../components/ticket-card';
import '../passenger.css';
export const dynamic='force-dynamic';
export default async function TicketsPage(){
 const user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/tickets'));const {tickets}=await ticketsData();
 return <PassengerShell active="tickets"><div className="sp-page-heading"><h1>Tiket saya</h1><p className="sp-muted">Detail perjalanan dan QR tiket yang Anda pesan.</p></div>{tickets===null?<StatePanel title="Tiket belum dapat dibuka" tone="danger">Kunci tiket belum tersedia untuk lingkungan ini.</StatePanel>:tickets.length===0?<StatePanel title="Belum ada tiket" action={<Link className="sp-primary" href="/trips">Cari perjalanan →</Link>}>Booking yang sudah dikonfirmasi akan muncul di sini.</StatePanel>:<section className="ticket-list" aria-label="Daftar tiket">{tickets.map(ticket=><TicketCard key={ticket.id} ticket={ticket}/>)}</section>}</PassengerShell>;
}
