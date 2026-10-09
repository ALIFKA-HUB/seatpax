import {it,expect} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import PassengerShell from '@/app/components/passenger-shell';
import StatusBadge from '@/app/components/status-badge';
import JourneySummary from '@/app/components/journey-summary';
import StatePanel from '@/app/components/state-panel';
it('keeps named navigation and marks the current route',()=>{
 const html=render(h(PassengerShell,{active:'tickets',children:'Content'}));
 expect(html).toContain('aria-current="page"');for(const path of ['/trips','/tickets','/account'])expect(html).toContain(`href="${path}"`);
 expect(html).toContain('Content');expect(render(h(PassengerShell,{focused:true,children:'Login'}))).toContain('aria-label="Seatpax"');
});
it('renders semantic status, long journey data and recovery',()=>{
 const html=render(h(JourneySummary,{fromName:'Asal sangat panjang',toName:'Tujuan <b>panjang</b>',departureAt:'2026-10-09T01:00:00Z',seatCode:'01',fare:'60000'}));
 expect(html).toContain('Asal sangat panjang');expect(html).toContain('&lt;b&gt;');expect(html).toContain('01');expect(html).toContain('Rp 60.000');expect(html).toContain('WIB');
 expect(render(h(StatusBadge,{label:'Menunggu pembayaran',tone:'warning'}))).toContain('Menunggu pembayaran');
 const panel=render(h(StatePanel,{title:'Belum ada tiket',action:h('a',{href:'/trips'},'Cari perjalanan')}));expect(panel).toContain('Belum ada tiket');expect(panel).toContain('href="/trips"');
});
