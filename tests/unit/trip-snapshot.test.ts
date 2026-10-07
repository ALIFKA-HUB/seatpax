import { expect, it } from 'vitest';
import { projectSnapshot } from '@/modules/trip/snapshot';
import type { PublicationSource } from '@/modules/trip/types';
const source=():PublicationSource=>({route:{id:'r',name:'Route',code:null,revision:1,status:'ACTIVE'},vehicle:{id:'v',name:'Bus',plateNumber:'A 1',revision:1,status:'ACTIVE'},serviceClass:{id:'c',name:'VIP',code:'vip',status:'ACTIVE'},template:{id:'t',version:1,status:'ACTIVE'},stops:Array.from({length:4},(_,i)=>({sourceId:`s${i}`,stopId:`stop${i}`,name:`Stop ${i}`,city:'City',address:null,sequence:i+1,arrivalOffsetMin:i?i*60:null,departureOffsetMin:i===3?null:i*60,status:'ACTIVE'})),fares:Array.from({length:3},(_,i)=>({fromSourceId:`s${i}`,toSourceId:`s${i+1}`,price:i?'9007199254740993':'0',currency:'IDR'})),layout:{rows:2,cols:3,cells:['SEAT','DRIVER','AISLE','DOOR','EMPTY','FACILITY'].map((type,i)=>({rowIndex:Math.floor(i/3),colIndex:i%3,type:type as PublicationSource['layout']['cells'][number]['type'],label:'label',seatCode:type==='SEAT'?'01':null}))}});
const draft={name:'Trip',routeId:'r',vehicleId:'v',serviceClassId:'c',departureWib:'2026-10-08T23:00',salesCloseWib:null};
it('projects all stops, fares, cells and seats without losing price precision',()=>{
  const p=projectSnapshot(source(),draft,'2026-10-07T00:00:00Z');
  expect(p.stops).toHaveLength(4);expect(p.segments).toHaveLength(3);expect(p.seats).toHaveLength(1);expect(p.layout.cells).toHaveLength(6);
  expect(p.segments.map(s=>s.price)).toEqual(['0','9007199254740993','9007199254740993']);
  expect(p.stops[3].arrivalAt).toBe('2026-10-08T19:00:00.000Z');
  expect(p.stops[0].arrivalAt).toBe(p.stops[0].departureAt);expect(p.stops[3].departureAt).toBe(p.stops[3].arrivalAt);
});
it('rejects missing fares, transit offsets, nonzero origin, inactive sources and past departure',()=>{
  for(const change of [(s:PublicationSource)=>{s.fares.pop();},(s:PublicationSource)=>{s.stops[1].departureOffsetMin=null;},(s:PublicationSource)=>{s.stops[1].arrivalOffsetMin=null;},(s:PublicationSource)=>{s.stops[0].departureOffsetMin=1;},(s:PublicationSource)=>{s.template.status='ARCHIVED';}]){const s=source();change(s);expect(()=>projectSnapshot(s,draft,'2026-10-07T00:00:00Z')).toThrow();}
  expect(()=>projectSnapshot(source(),draft,'2026-10-09T00:00:00Z')).toThrow();
});
it('checks global cutoff bounds',()=>{
  expect(()=>projectSnapshot(source(),{...draft,salesCloseWib:'2026-10-07T00:00'},'2026-10-07T00:00:00Z')).toThrow();
  expect(()=>projectSnapshot(source(),{...draft,salesCloseWib:'2026-10-09T04:00'},'2026-10-07T00:00:00Z')).toThrow();
});
