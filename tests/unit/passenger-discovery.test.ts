import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {filterAndSortTrips,readDiscoveryQuery} from '@/modules/inventory/discovery-presentation';
import type {SearchResult} from '@/modules/inventory/types';
import TripCard from '@/app/components/trip-card';
import TripDiscovery from '@/app/trips/components/trip-discovery';
import SearchForm from '@/app/trips/components/search-form';
import TripsLoading from '@/app/trips/loading';
const base={tripId:'a',name:'Trip',companyName:'PO',fromStopId:'origin',toStopId:'end',originName:'Bandung',destinationName:'Bogor',departureAt:'2026-10-20T01:00:00Z',className:'Ekonomi',fare:'10000',availableCount:1};
const trips:SearchResult[]=[base,{...base,tripId:'b',className:'Eksekutif',fare:'9000',departureAt:'2026-10-20T02:00:00Z'}];
it('flags repeated search parameters and tracks explicit date presence',()=>{
 expect(readDiscoveryQuery({date:['bad','2026-10-21']},'2026-10-20').malformed).toBe(true);
 expect(readDiscoveryQuery({from:['a','b']},'2026-10-20').malformed).toBe(true);
 expect(readDiscoveryQuery({date:'2026-10-21'},'2026-10-20')).toMatchObject({date:'2026-10-21',hasExplicitDate:true,malformed:false});
 expect(readDiscoveryQuery({from:'',to:'',date:''},'2026-10-20')).toMatchObject({from:undefined,to:undefined,date:'2026-10-20',hasExplicitDate:false,malformed:false});
});
it('sorts exact fares without mutating records and retains interval IDs',()=>{const sorted=filterAndSortTrips(trips,{classNames:[],maxFare:'',sort:'price'});expect(sorted.map(t=>t.tripId)).toEqual(['b','a']);expect(trips[0].tripId).toBe('a');expect(sorted[0].fromStopId).toBe('origin');});
it('applies inclusive class and maximum-fare filters and can reset',()=>{expect(filterAndSortTrips(trips,{classNames:['Ekonomi'],maxFare:'10000',sort:'departure'})).toEqual([base]);expect(filterAndSortTrips(trips,{classNames:[],maxFare:'8999',sort:'departure'})).toEqual([]);expect(filterAndSortTrips(trips,{classNames:[],maxFare:'',sort:'departure'})).toEqual(trips);});
it('does not crash on malformed fare filters or lose integer precision',()=>{expect(filterAndSortTrips(trips,{classNames:[],maxFare:'invalid',sort:'price'})).toHaveLength(2);const huge=[{...base,fare:'9007199254740993'},{...base,tripId:'b',fare:'9007199254740992'}];expect(filterAndSortTrips(huge,{classNames:[],maxFare:'9007199254740992',sort:'price'}).map(t=>t.tripId)).toEqual(['b']);});
it('shows honest unknown arrival and route-specific CTA',()=>{const html=render(h(TripCard,{trip:base}));expect(html).toContain('Pilih kursi');expect(html).toContain('/trips/a?from=origin&amp;to=end');expect(html).toContain('Waktu tiba belum tersedia');expect(html).not.toContain('jam perjalanan');});
it('shows fallback upcoming trips when an explicit date has no departures',()=>{
 const html=render(h(TripDiscovery,{trips:[],fallbackTrips:trips,locations:[],quickDates:[{dateWib:'2026-10-20',label:'Sel, 20 Okt'}],candidateLimitReached:false,dateWib:'2026-10-19',hasExplicitDate:true}));
 expect(html).toContain('Belum ada jadwal pada');
 expect(html).toContain('Jadwal shuttle terdekat yang tersedia');
 expect(html).toContain('Bandung');
 expect(html).toContain('Pilih kursi');
});
it('renders ticket-stub trip card without duplicated route text in footer meta',()=>{
 const withArrival:SearchResult={...base,arrivalAt:'2026-10-20T03:30:00Z'};
 const html=render(h(TripCard,{trip:withArrival}));
 expect(html).toContain('tp-card-purchase');
 expect(html).toContain('tp-cta-accent');
 expect(html).toContain('tp-duration-pill');
 expect(html).toContain('2j 30m');
 expect(html).not.toContain('Bandung → Bogor');
});
it('renders two-line date chips and segmented sort controls in discovery toolbar',()=>{
 const html=render(h(TripDiscovery,{trips,fallbackTrips:[],locations:[],quickDates:[{dateWib:'2026-10-20',label:'Sel, 20 Okt'}],candidateLimitReached:false,dateWib:'2026-10-20',hasExplicitDate:false}));
 expect(html).toContain('tp-date-day');
 expect(html).toContain('Sel');
 expect(html).toContain('20 Okt');
 expect(html).toContain('tp-segmented');
 expect(html).toContain('Berangkat awal');
 expect(html).toContain('Harga terendah');
});
it('renders orange accent submit button in search form',()=>{
 const html=render(h(SearchForm,{locations:[{id:'a',name:'Pool Pasteur',city:'Bandung'}],initial:{}}));
 expect(html).toContain('tp-cta-accent');
 expect(html).toContain('Cari jadwal');
});
it('renders AdminSelect stop pickers with city subtitles and zero middle dots in SearchForm',()=>{
 const html=render(
  h(SearchForm,{
   locations:[
    {id:'a',name:'Pool Pasteur',city:'Bandung',address:'Jl. Pasteur 10'},
    {id:'b',name:'Pool Cianjur',city:'Cianjur',address:'Jl. Raya 2'},
   ],
   initial:{from:'a'},
  }),
 );
 expect(html).toContain('admin-select-trigger');
 expect(html).toContain('Pool Pasteur');
 expect(html).toContain('Bandung');
 expect(html).toContain('tp-cta-accent');
 expect(html).toContain('Cari jadwal');
 expect(html).toContain('name="from"');
 expect(html).toContain('name="to"');
 expect(html.match(/<option value=""/g)).toHaveLength(2);
 expect(html).not.toContain(' · ');
 expect(html).not.toContain('—');
});
it('surfaces optional vehicle, intermediate stops, city, capacity, and cutoff on enriched TripCard without middle dots',()=>{
 const enriched:SearchResult={
  ...base,
  arrivalAt:'2026-10-20T03:30:00Z',
  vehicleName:'HiAce Premio',
  seatCapacity:14,
  stopCount:3,
  intermediateStops:['Cianjur'],
  originCity:'Bandung',
  destinationCity:'Bogor',
  cutoff:'2026-10-20T00:45:00Z',
 };
 const html=render(h(TripCard,{trip:enriched}));
 expect(html).toContain('HiAce Premio');
 expect(html).toContain('1 / 14 kursi');
 expect(html).toContain('Via Cianjur');
 expect(html).toContain('Bandung');
 expect(html).toContain('Bogor');
 expect(html).toContain('Pesan sebelum');
 expect(html).toContain('tp-card-purchase');
 expect(html).toContain('tp-cta-accent');
 expect(html).toContain('tp-duration-pill');
 expect(html).toContain('2j 30m');
 expect(html).not.toContain('Bandung → Bogor');
 expect(html).not.toContain(' · ');
 expect(html).not.toContain('—');

 const directHtml=render(h(TripCard,{trip:{...base,stopCount:2,intermediateStops:[]}}));
 expect(directHtml).toContain('Langsung');
 expect(directHtml).not.toContain(' · ');
});
it('renders 0 / capacity kursi with is-full when seatCapacity > 0 and availableCount === 0',()=>{
 const html=render(h(TripCard,{trip:{...base,availableCount:0,seatCapacity:14}}));
 expect(html).toContain('0 / 14 kursi');
 expect(html).toContain('tp-seat-pill is-full');
 expect(html).not.toContain('0 kursi tersedia');
});
it('styles sp-journey-tags in passenger.css and preserves SearchForm label and open trigger specificity in trips.css',()=>{
 const passengerCss=readFileSync(new URL('../../app/passenger.css',import.meta.url),'utf8');
 expect(passengerCss).toContain('.passenger-shell .sp-journey-tags');
 expect(passengerCss).toContain('.passenger-shell .sp-journey-tag');
 expect(passengerCss).toMatch(/\.passenger-shell \.seat-cell\{[^}]*overflow-wrap:anywhere/);

 const tripsCss=readFileSync(new URL('../../app/trips/trips.css',import.meta.url),'utf8');
 expect(tripsCss).toContain('.passenger-shell .tp-field-label');
 expect(tripsCss).toContain('.passenger-shell .tp-field > span');
 expect(tripsCss).toContain("button.admin-select-trigger:hover:not(:disabled):not([aria-expanded='true'])");
});
it('renders clean consumer trip discovery without Admin-PO Bento sidebar or KPI dashboard cards',()=>{
 const html=render(
  h(TripDiscovery,{
   trips:[],
   fallbackTrips:[],
   locations:[
    {id:'stopA',name:'Pool Pasteur',city:'Bandung',address:'Jl. Pasteur 10'},
    {id:'stopC',name:'Pool Baranangsiang',city:'Bogor',address:'Jl. Pajajaran 12'},
   ],
   quickDates:[],
   candidateLimitReached:false,
   dateWib:'2026-10-21',
   hasExplicitDate:true,
   from:'stopA',
   to:'stopC',
  }),
 );
 expect(html).toContain('Belum ada jadwal perjalanan terbuka');
 expect(html).toContain('Pool Pasteur (Bandung)');
 expect(html).toContain('Pool Baranangsiang (Bogor)');
 expect(html).toContain('Tampilkan semua jadwal');
 expect(html).not.toContain('tp-dash-bento');
 expect(html).not.toContain('tp-kpi-grid');
 expect(html).not.toContain('Kalender keberangkatan');
 expect(html).not.toContain(' · ');
 expect(html).not.toContain('—');
 expect(html).not.toContain('tp-eyebrow');
});
it('renders populated consumer trip list directly without nested Bento sidebar and zero middle dots or em-dashes',()=>{
 const fiveTrips:SearchResult[]=[
  base,
  {...base,tripId:'b',name:'Trip B',departureAt:'2026-10-20T02:00:00Z'},
  {...base,tripId:'c',name:'Trip C',departureAt:'2026-10-20T03:00:00Z'},
 ];
 const html=render(
  h(TripDiscovery,{
   trips:fiveTrips,
   fallbackTrips:[],
   locations:[{id:'origin',name:'Pool Pasteur',city:'Bandung',address:'Jl. Pasteur 10'}],
   quickDates:[{dateWib:'2026-10-20',label:'Sel, 20 Okt'}],
   candidateLimitReached:false,
   dateWib:'2026-10-20',
   hasExplicitDate:true,
  }),
 );
 expect(html).toContain('tp-results');
 expect(html).toContain('tp-list');
 expect(html).toContain('3 perjalanan tersedia');
 expect(html).not.toContain('tp-dash-bento');
 expect(html).not.toContain('tp-side-col');
 expect(html).not.toContain('tp-seat-dot');
 expect(html).not.toContain(' · ');
 expect(html).not.toContain('—');
 expect(html).not.toContain('tp-eyebrow');
});
it('renders accessible consumer skeleton in TripsLoading without KPI or Bento dashboard blocks',()=>{
 const html=render(h(TripsLoading));
 expect(html).toContain('aria-busy="true"');
 expect(html).toContain('role="status"');
 expect(html).toContain('tp-page');
 expect(html).toContain('tp-loading');
 expect(html).toContain('tp-skeleton-shimmer');
 expect(html).toContain('tp-skeleton-search');
 expect(html).toContain('tp-skeleton-list');
 expect(html).not.toContain('tp-dash-bento');
 expect(html).not.toContain('tp-kpi-grid');
 expect(html).not.toContain('tp-eyebrow');
 expect(html).not.toContain(' · ');
 expect(html).not.toContain('—');
});
