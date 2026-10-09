import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {ticketsData} from './data';
import '../passenger.css';
export const dynamic='force-dynamic';
export default async function TicketsPage(){const user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/tickets'));const {tickets}=await ticketsData();return <main className="passenger"><nav><Link href="/account">← Akun</Link><Link href="/trips">Cari perjalanan</Link></nav><h1>Tiket saya</h1>{tickets===null?<section className="passenger-card"><p>Tiket belum dapat dibuka. Kunci ticket belum tersedia untuk lingkungan ini.</p></section>:tickets.length===0?<section className="ticket-empty"><h2>Belum ada tiket</h2><p>Booking yang sudah dikonfirmasi akan muncul di sini.</p><Link href="/trips">Cari perjalanan →</Link></section>:<section className="ticket-list">{tickets.map(ticket=><article className="passenger-card" key={ticket.id}><h2>{ticket.snapshot.fromName} → {ticket.snapshot.toName}</h2><p>{ticket.snapshot.tripName} · Kursi {ticket.snapshot.seatCode}</p><p>{ticket.passenger.name} · {ticket.bookingStatus==='REFUNDED'?'Refunded':'Dikonfirmasi'}</p><Link href={`/tickets/${ticket.id}`}>Buka ticket →</Link></article>)}</section>}</main>;}
