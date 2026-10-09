import {it,expect,vi} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import type {TripDetail} from '@/modules/trip/types';
export const detail:TripDetail={
 trip:{id:'trip',companyId:'company',name:'Perjalanan demo',routeId:'route',vehicleId:'vehicle',serviceClassId:'class',departureAt:'2026-10-10T01:00:00Z',salesCloseAt:null,revision:1,status:'OPEN_FOR_SALE',publishedAt:'2026-10-09T01:00:00Z',
 identity:{routeName:'Bandung <utara> → Bogor',routeCode:null,routeRevision:1,vehicleName:'Bus A',plateNumber:'B 1234 DEM',vehicleRevision:1,className:'Eksekutif',classCode:'E',templateId:'layout',templateVersion:1}},
 stops:[{sourceId:'src1',stopId:'a',name:'Bandung',city:'Bandung',address:'Terminal',sequence:1,arrivalAt:'2026-10-10T01:00:00Z',departureAt:'2026-10-10T01:00:00Z'},{sourceId:'src2',stopId:'b',name:'Bogor',city:'Bogor',address:null,sequence:2,arrivalAt:'2026-10-10T04:00:00Z',departureAt:'2026-10-10T04:00:00Z'}],
 segments:[{sequence:1,fromSequence:1,toSequence:2,price:'60000',currency:'IDR'}],
 seats:[{seatCode:'01-LONG-SEAT-CODE',rowIndex:0,colIndex:0,label:null}],
 layout:{rows:1,cols:1,cells:[{rowIndex:0,colIndex:0,type:'SEAT',seatCode:'01-LONG-SEAT-CODE',label:null}]},inventoryCount:1
};
const listMine=vi.fn(async()=>[detail.trip]);
vi.mock('@/app/crew/data',()=>({crewData:async()=>({actorId:'actor',crew:{listMine}})}));
it('renders snapshot trip identity and explicit destinations',async()=>{
 const {default:Summary}=await import('@/app/crew/components/trip-summary');
 const html=render(h(Summary,{detail}));
 for(const text of ['Bandung &lt;utara&gt;','B 1234 DEM','Bus A','WIB','Eksekutif','href="/crew/trips/trip/scan"','href="/crew/trips/trip/manifest"'])expect(html).toContain(text);
 expect(html).not.toContain('unit inventori');
});
it('preserves schedule fare and layout in expandable details',async()=>{
 const {default:Summary}=await import('@/app/crew/components/trip-summary');
 const html=render(h(Summary,{detail}));
 for(const text of ['<details','Rincian perjalanan','Bandung','Bogor','60.000','aria-label="Denah kursi"','01-LONG-SEAT-CODE'])expect(html).toContain(text);
});
it('renders missing optional identity safely',async()=>{
 const {default:Summary}=await import('@/app/crew/components/trip-summary');
 const html=render(h(Summary,{detail:{...detail,trip:{...detail.trip,identity:null},layout:null}}));
 expect(html).toContain('Perjalanan demo');expect(html).not.toContain('undefined');expect(html).not.toContain('B 1234 DEM');
});
it('shows an assignment empty state without adding a sort',async()=>{
 listMine.mockResolvedValueOnce([]);
 const {default:Page}=await import('@/app/crew/page');
 const html=render(await Page());expect(html).toContain('Belum ada perjalanan');expect(html).toContain('Admin PO');
 listMine.mockResolvedValueOnce([detail.trip,{...detail.trip,id:'second',name:'Perjalanan kedua'}]);
 const list=render(await Page());expect(list.indexOf('Perjalanan demo')).toBeLessThan(list.indexOf('Perjalanan kedua'));
});
