import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {ticketsData} from './data';
import PassengerShell from '../components/passenger-shell';
import TicketCenter from './components/ticket-center';
import '../passenger.css';
import '../components/passenger-flow.css';
import './tickets.css';

export const dynamic='force-dynamic';

export default async function TicketsPage(){
 const user=await getVerifiedUser();
 if(!user)redirect('/login?next='+encodeURIComponent('/tickets'));
 const {tickets,activeHolds,pendingBookings}=await ticketsData();

 return <PassengerShell active="tickets">
  <TicketCenter
   tickets={tickets??[]}
   activeHolds={activeHolds}
   pendingBookings={pendingBookings}
   keyUnavailable={tickets===null}
  />
 </PassengerShell>;
}
