import {it,expect,vi} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import PassengerProfileView from '@/app/crew/components/passenger-profile';
import type {PassengerProfile} from '@/modules/boarding/types';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:()=>{}})}));
vi.mock('@/app/crew/boarding-actions',()=>({boardPassengerAction:vi.fn(),resolveBoardingAction:vi.fn()}));
vi.mock('@/app/crew/snack-actions',()=>({claimSnackAction:vi.fn()}));
const profile:PassengerProfile={ticketId:'ticket',name:'Penumpang <panjang>',seatCode:'01-LONG-CODE',fromStopId:'a',fromSequence:1,fromName:'Bandung',toName:'Bogor',tripName:'Demo',vehicleName:'Bus A',plateNumber:'B 1234 DEM',departureAt:'2026-10-10T01:00:00Z',boarding:null,snack:null};
it('labels the idle camera and exposes manual fallback without success',async()=>{
 const {default:Scanner}=await import('@/app/crew/components/qr-scanner');
 const html=render(h(Scanner,{tripId:'trip',stops:[]}));
 expect(html).toContain('aria-label="Pratinjau kamera scanner"');expect(html).toContain('href="/crew/trips/trip/manifest"');
 expect(html).toContain('Kamera belum dinyalakan');expect(html).not.toContain('Sudah naik');
});
it('keeps separate explicit boarding and snack controls',async()=>{
 const {default:Boarding}=await import('@/app/crew/components/boarding-form');
 const {default:Snack}=await import('@/app/crew/components/snack-form');
 const html=render(h(Boarding,{tripId:'trip',profile,stops:[{id:'a',name:'Bandung',sequence:1}],source:'MANIFEST'}));
 expect(html).toContain('Tandai sudah naik');expect(html).toContain('class="crew-primary"');expect(html).toContain('value="a" selected');
 const before=render(h(Snack,{tripId:'trip',profile}));expect(before).toContain('disabled');expect(before).toContain('Catat boarding dahulu');
 const boarded={...profile,boarding:{id:'b',ticketId:'ticket',tripId:'trip',stopId:'a',actorId:'actor',source:'QR' as const,boardedAt:'2026-10-10T01:03:00Z'}};
 const after=render(h(Snack,{tripId:'trip',profile:boarded}));expect(after).not.toContain('disabled');expect(after).toContain('Serahkan snack');
 const recorded=render(h(Boarding,{tripId:'trip',profile:boarded,stops:[],source:'QR'}));expect(recorded).not.toContain('<button');expect(recorded).toContain('08.03 WIB');
 const claimed=render(h(Snack,{tripId:'trip',profile:{...boarded,snack:{claimedAt:'2026-10-10T01:04:00Z'}}}));expect(claimed).not.toContain('<button');expect(claimed).toContain('08.04 WIB');
});
it('renders prominent seat and safe operational facts',()=>{
 const html=render(h(PassengerProfileView,{profile}));
 expect(html).toContain('<strong>01-LONG-CODE</strong>');expect(html).toContain('Penumpang &lt;panjang&gt;');
 for(const text of ['Bandung','Bogor','B 1234 DEM','Belum naik','Snack belum diserahkan'])expect(html).toContain(text);
});
it('renders boarding and snack labels with original WIB times',()=>{
 const html=render(h(PassengerProfileView,{profile:{...profile,boarding:{id:'b',ticketId:'ticket',tripId:'trip',stopId:'a',actorId:'actor',source:'QR',boardedAt:'2026-10-10T01:03:00Z'},snack:{claimedAt:'2026-10-10T01:04:00Z'}}}));
 for(const text of ['Sudah naik','Snack sudah diserahkan','08.03 WIB','08.04 WIB'])expect(html).toContain(text);
});
