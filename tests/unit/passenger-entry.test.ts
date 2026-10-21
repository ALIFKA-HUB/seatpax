import {it,expect,vi} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import Home from '@/app/page';
import TripCard from '@/app/components/trip-card';
// The async planner has separate tests; this page test must not open a database.
vi.mock('@/app/landing/journey-planner',()=>({default:()=>null,PlannerSkeleton:()=>null}));
it('provides the passenger entry instead of a development setup page',()=>{
 const html=render(h(Home));expect(html).toContain('Antarkota,');expect(html).toContain('lebih nyaman.');expect(html).toContain('href="/trips"');expect(html).toContain('href="/tickets"');expect(html).toContain('href="/account"');expect(html).not.toContain('Development');expect(html).not.toContain('Fondasi aplikasi');
 for(const text of ['Cari perjalanan','Pilih kursi','Bayar pesanan','Buka tiket','lp-hero','forest-road.jpg','morning-road.jpg'])expect(html).toContain(text);
});
it('renders real journey data and retains interval query parameters',()=>{
 const html=render(h(TripCard,{trip:{tripId:'a',name:'Trip A',companyName:'PO A',fromStopId:'origin',toStopId:'end',originName:'Bandung',destinationName:'Bogor',departureAt:'2026-10-09T01:00:00Z',className:'Eksekutif',fare:'60000',availableCount:0}}));
 for(const text of ['PO A','Eksekutif','Rp 60.000','0 kursi tersedia','Pilih kursi'])expect(html).toContain(text);
 expect(html).toContain('/trips/a?from=origin&amp;to=end');
});
