import {it,expect} from 'vitest';
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
