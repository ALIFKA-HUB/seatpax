import {it,expect} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import TicketCard from '@/app/components/ticket-card';
import TicketCenter from '@/app/tickets/components/ticket-center';
import type {TicketView} from '@/modules/ticket/service';
const ticket={id:'t',tripId:'trip',companyId:'po',assignmentId:'a',bookingStatus:'CONFIRMED',passenger:{name:'Nama penumpang yang sangat panjang sekali',phone:'08000000000'},snapshot:{tripName:'Trip A',vehicleName:'Bus A',plateNumber:'B 1234',seatCode:'01',fromName:'Bandung',toName:'Bogor',departureAt:'2026-10-09T01:00:00Z'},amount:'60000',qrToken:'test-only-token'} satisfies TicketView;
it('shows owned ticket metadata without exposing its QR secret in the list',()=>{
 const html=render(h(TicketCard,{ticket}));for(const text of ['Nama penumpang yang sangat panjang sekali','01','WIB','Rp 60.000','/tickets/t'])expect(html).toContain(text);expect(html).not.toContain('test-only-token');
 expect(render(h(TicketCard,{ticket:{...ticket,bookingStatus:'REFUNDED'}}))).toContain('Refund simulasi tercatat');
});
it('preserves server QR lifecycle and generation boundary',()=>{
 const source=readFileSync(new URL('../../app/tickets/[ticketId]/page.tsx',import.meta.url),'utf8');
 expect(source).toContain("ticket.bookingStatus==='CONFIRMED'");expect(source).toContain('QRCode.toDataURL(ticket.qrToken');expect(source).toContain("errorCorrectionLevel:'M'");expect(source).toContain('Tunjukkan QR ini kepada petugas saat naik.');
});
it('renders interactive ticket filter controls and pending order continuation in TicketCenter',()=>{
 const html=render(h(TicketCenter,{tickets:[ticket],activeHolds:[{id:'h1',tripName:'Shuttle Pagi',fromName:'Bandung',toName:'Bogor',departureAt:'2026-10-09T01:00:00Z',seatCode:'01',expiresAt:'2026-10-09T01:10:00Z'}],pendingBookings:[]}));
 for(const text of ['Perlu diselesaikan sekarang','/checkout/h1','Siap dipakai','Riwayat dan refund','Cari rute, kursi, penumpang'])expect(html).toContain(text);
});
