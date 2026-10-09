import {it,expect,vi} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import PassengerProfileView from '@/app/crew/components/passenger-profile';
import type {PassengerProfile} from '@/modules/boarding/types';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:()=>{}})}));
vi.mock('@/app/crew/boarding-actions',()=>({boardPassengerAction:vi.fn(),resolveBoardingAction:vi.fn()}));
vi.mock('@/app/crew/snack-actions',()=>({claimSnackAction:vi.fn()}));
const profile:PassengerProfile={ticketId:'ticket',name:'Penumpang <panjang>',seatCode:'01-LONG-CODE',fromStopId:'a',fromSequence:1,fromName:'Bandung',toName:'Bogor',tripName:'Demo',vehicleName:'Bus A',plateNumber:'B 1234 DEM',departureAt:'2026-10-10T01:00:00Z',boarding:null,snack:null};
it('renders prominent seat and safe operational facts',()=>{
 const html=render(h(PassengerProfileView,{profile}));
 expect(html).toContain('<strong>01-LONG-CODE</strong>');expect(html).toContain('Penumpang &lt;panjang&gt;');
 for(const text of ['Bandung','Bogor','B 1234 DEM','Belum naik','Snack belum diserahkan'])expect(html).toContain(text);
});
it('renders boarding and snack labels with original WIB times',()=>{
 const html=render(h(PassengerProfileView,{profile:{...profile,boarding:{id:'b',ticketId:'ticket',tripId:'trip',stopId:'a',actorId:'actor',source:'QR',boardedAt:'2026-10-10T01:03:00Z'},snack:{claimedAt:'2026-10-10T01:04:00Z'}}}));
 for(const text of ['Sudah naik','Snack sudah diserahkan','08.03 WIB','08.04 WIB'])expect(html).toContain(text);
});
