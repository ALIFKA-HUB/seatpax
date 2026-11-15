import {expect,it} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {filterAndSortTrips,readDiscoveryQuery} from '@/modules/inventory/discovery-presentation';
import type {SearchResult} from '@/modules/inventory/types';
import TripCard from '@/app/components/trip-card';
import TripDiscovery from '@/app/trips/components/trip-discovery';
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
