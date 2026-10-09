import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import BookingOutcome from '@/app/components/booking-outcome';
import type {BookingView} from '@/modules/booking/types';
const base={id:'b',ticketId:'ticket-a',status:'CONFIRMED'} as BookingView;
it('offers only a confirmed real ticket and describes review/expiry honestly',()=>{
 expect(render(h(BookingOutcome,{booking:base}))).toContain('/tickets/ticket-a');
 for(const status of ['PENDING_PAYMENT','PAYMENT_CONFLICT','EXPIRED','REFUNDED','UNKNOWN']){
  const html=render(h(BookingOutcome,{booking:{...base,status} as BookingView}));expect(html).not.toContain('/tickets/ticket-a');
  if(status==='PAYMENT_CONFLICT')expect(html).toContain('tiket belum diterbitkan');
  if(status==='REFUNDED')expect(html).toContain('tidak mengirim pengembalian uang');
  if(status==='UNKNOWN')expect(html).toContain('Status perlu diperiksa');
 }
 expect(render(h(BookingOutcome,{booking:{...base,ticketId:null}}))).not.toContain('/tickets/');
});

it('keeps controls outside payment live announcements',()=>{
 const outcome=render(h(BookingOutcome,{booking:base}));
 expect(outcome).toMatch(/role="status"[^>]*>[\s\S]*?<\/div><p><a/);
 const bookingSource=readFileSync(new URL('../../app/bookings/components/booking-status.tsx',import.meta.url),'utf8');
 const checkoutSource=readFileSync(new URL('../../app/checkout/components/checkout-form.tsx',import.meta.url),'utf8');
 expect(bookingSource).not.toContain('className="passenger-card sp-ticket-panel" aria-live');
 expect(checkoutSource).not.toContain('className="checkout-progress" role="status"');
});
