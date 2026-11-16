import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import SeatSelection from '@/app/trips/components/seat-selection';
import type {AvailabilityView} from '@/modules/inventory/types';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock('@/app/trips/actions',()=>({createHoldAction:vi.fn(),refreshAvailabilityAction:vi.fn(),releaseHoldAction:vi.fn()}));
const cells=[{rowIndex:0,colIndex:0,type:'SEAT',seatCode:'01',label:null},{rowIndex:0,colIndex:1,type:'AISLE',seatCode:null,label:'Lorong'},{rowIndex:0,colIndex:2,type:'SEAT',seatCode:'02',label:null},{rowIndex:1,colIndex:0,type:'DRIVER',seatCode:null,label:'Sopir'},{rowIndex:1,colIndex:1,type:'DOOR',seatCode:null,label:'Pintu'},{rowIndex:1,colIndex:2,type:'SEAT',seatCode:'03',label:null},{rowIndex:2,colIndex:0,type:'EMPTY',seatCode:null,label:null},{rowIndex:2,colIndex:1,type:'FACILITY',seatCode:null,label:'Bagasi'},{rowIndex:2,colIndex:2,type:'EMPTY',seatCode:null,label:null}];
const view={fare:'60000',saleOpen:true,cutoff:'2026-10-09T00:00:00Z',serverNow:'2026-10-08T00:00:00Z',detail:{trip:{id:'trip-a',name:'Trip A'},stops:[{id:'from',sequence:1,name:'Bandung',city:'Bandung',address:'Jl. Asia Afrika',arrivalAt:'2026-10-09T01:00:00Z',departureAt:'2026-10-09T01:00:00Z'},{id:'mid',sequence:2,name:'Cianjur',city:'Cianjur',address:null,arrivalAt:'2026-10-09T02:00:00Z',departureAt:'2026-10-09T02:10:00Z'},{id:'to',sequence:3,name:'Bogor',city:'Bogor',address:'Terminal Baranangsiang',arrivalAt:'2026-10-09T03:00:00Z',departureAt:'2026-10-09T03:00:00Z'}],segments:[{sequence:1,fromSequence:1,toSequence:2,price:'25000',currency:'IDR'},{sequence:2,fromSequence:2,toSequence:3,price:'35000',currency:'IDR'}],layout:{rows:3,cols:3,cells}},seats:[{id:'s1',seatCode:'01',rowIndex:0,colIndex:0,label:null,status:'AVAILABLE'},{id:'s2',seatCode:'02',rowIndex:0,colIndex:2,label:null,status:'HELD'},{id:'s3',seatCode:'03',rowIndex:1,colIndex:2,label:null,status:'BOOKED'}]} as unknown as AvailabilityView;
it('preserves layout order, disabled seats and a named scroll region',()=>{
 const html=render(h(SeatSelection,{initial:view,from:'from',to:'to',loggedIn:true}));
 expect(html).toContain('aria-label="Peta kursi"');expect(html).toContain('aria-label="Legenda kursi"');
 expect(html.indexOf('Kursi 01')).toBeLessThan(html.indexOf('Lorong'));expect(html.indexOf('Lorong')).toBeLessThan(html.indexOf('Kursi 02'));
 for(const text of ['Sopir','Pintu','Bagasi','Kursi 03, terjual','Kursi 02, ditahan','aria-pressed="false"'])expect(html).toContain(text);
 expect(html).toMatch(/disabled=""[^>]*aria-label="Kursi 02, ditahan"/);
});
it('retains login interval and disables closed-sale hold action',()=>{
 const loggedOut=render(h(SeatSelection,{initial:view,from:'from',to:'to',loggedIn:false}));expect(loggedOut).toContain('/login?next=%2Ftrips%2Ftrip-a%3Ffrom%3Dfrom%26to%3Dto');
 const closed=render(h(SeatSelection,{initial:{...view,saleOpen:false},from:'from',to:'to',loggedIn:true}));expect(closed).toContain('Penjualan interval ini sudah ditutup.');expect(closed).toMatch(/disabled=""[^>]*>Tahan kursi 10 menit/);
});

it('wraps long codes inside seat cells',()=>{
 const css=readFileSync(new URL('../../app/passenger.css',import.meta.url),'utf8');
 expect(css).toMatch(/\.passenger-shell \.seat-cell\{[^}]*overflow-wrap:anywhere/);
});
it('renders open boarding-dropoff timeline with addresses and segment fares',()=>{
 const html=render(h(SeatSelection,{initial:view,from:'from',to:'to',loggedIn:true}));
 for(const text of ['Urutan titik naik dan turun','Bandung','Cianjur','Bogor','Jl. Asia Afrika','Terminal Baranangsiang','Rp 25.000','Rp 60.000','Rp 35.000'])expect(html).toContain(text);
});
it('surfaces owned active hold controls so user returning from checkout can resume or release',()=>{
 const html=render(h(SeatSelection,{initial:view,from:'from',to:'to',loggedIn:true,activeHold:{id:'hold-1',seatCode:'02',expiresAt:'2026-10-08T00:10:00Z'}}));
 for(const text of ['Kursi 02 sedang Anda tahan','/checkout/hold-1','Lanjutkan checkout','Lepaskan kursi','Informasi dan ketentuan'])expect(html).toContain(text);
});
