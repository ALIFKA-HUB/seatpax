import {it,expect} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import ManifestList from '@/app/crew/components/manifest-list';
import {filterPassengers} from '@/modules/boarding/ui-state';
import type {ManifestView} from '@/modules/boarding/types';
const view:ManifestView={tripId:'trip',companyId:'company',tripName:'Demo',departureAt:'2026-10-10T01:00:00Z',capacity:30,passengerCount:1,boardedCount:0,stops:[],passengers:[{ticketId:'ticket',name:'Nama <panjang>',seatCode:'01-LONG-CODE',fromName:'Bandung',toName:'Bogor',boarding:null,snack:null}]};
it('shows existing counters and operational passenger fields',()=>{
 const html=render(h(ManifestList,{view}));
 for(const text of ['30','Total penumpang','1','Sudah naik','0','Nama &lt;panjang&gt;','01-LONG-CODE','Bandung','Bogor','href="/crew/trips/trip/passengers/ticket"'])expect(html).toContain(text);
 expect(html).toContain('class="manifest-seat"');
});
it('keeps Admin manifest read-only',()=>{
 const html=render(h(ManifestList,{view,readOnly:true}));
 expect(html).not.toContain('/passengers/ticket');expect(html).toContain('hanya untuk dibaca');
});
it('distinguishes empty manifest copy from filtered no matches',()=>{
 expect(render(h(ManifestList,{view:{...view,passengers:[],passengerCount:0}}))).toContain('Belum ada penumpang terkonfirmasi');
 expect(filterPassengers(view.passengers,'tidak cocok','ALL')).toEqual([]);
 expect(view.passengers).toHaveLength(1);
});
