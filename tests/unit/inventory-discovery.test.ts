import {beforeEach,expect,it,vi} from 'vitest';
import {createAvailabilityService} from '@/modules/inventory/availability-service';
import {createInventoryRepository,type InventoryRepository,type Snapshot} from '@/modules/inventory/repository';

const row={tripId:'trip',fromStopId:'origin',toStopId:'destination'};
function fixture():Snapshot{return {
 trip:{id:'trip',status:'OPEN_FOR_SALE',salesCloseAt:null,name:'Trip',identity:{className:'Eksekutif'}},
 companyName:'PO',companyStatus:'ACTIVE',serverNow:'2026-10-20T00:00:00Z',
 stops:[{id:'origin',sequence:0,name:'Bandung',departureAt:'2026-10-20T01:00:00Z'},{id:'destination',sequence:1,name:'Bogor',arrivalAt:null}],
 segments:[{sequence:0,price:'60000',currency:'IDR'}],
 seats:[{id:'free'},{id:'held'}],anchors:[{seatId:'free',sequence:0},{seatId:'held',sequence:0}],
 holds:[{seatId:'held',from:0,to:1}],booked:[],layout:null,inventoryCount:2,
} as unknown as Snapshot;}
let snapshot:Snapshot;
const candidates=vi.fn(),upcoming=vi.fn(),upcomingRoute=vi.fn(),read=vi.fn();
const service=()=>createAvailabilityService({client:{},discoveryCandidates:candidates,upcomingCandidates:upcoming,upcomingRouteCandidates:upcomingRoute,snapshot:read} as unknown as InventoryRepository);
beforeEach(()=>{snapshot=fixture();candidates.mockReset().mockResolvedValue([row]);upcoming.mockReset().mockResolvedValue([row]);upcomingRoute.mockReset().mockResolvedValue([row]);read.mockReset().mockImplementation(async()=>snapshot);});
it('discovers real full-route fare, holds and nullable arrival within a WIB day',async()=>{
 const result=await service().discover({dateWib:'2026-10-20'});
 expect(candidates).toHaveBeenCalledWith('2026-10-19T17:00:00.000Z','2026-10-20T17:00:00.000Z',51);
 expect(result.trips[0]).toMatchObject({fare:'60000',availableCount:1,fromStopId:'origin',toStopId:'destination',arrivalAt:null});
 expect(JSON.stringify(result)).not.toContain('held');
});
it('caps snapshot reads and reports truncation honestly',async()=>{candidates.mockResolvedValue(Array.from({length:51},()=>row));const result=await service().discover({dateWib:'2026-10-20'});expect(result.trips).toHaveLength(50);expect(read).toHaveBeenCalledTimes(50);expect(result.candidateLimitReached).toBe(true);});
it('does not advertise closed or suspended snapshots',async()=>{snapshot.companyStatus='SUSPENDED';expect((await service().discover({dateWib:'2026-10-20'})).trips).toEqual([]);snapshot.companyStatus='ACTIVE';snapshot.serverNow='2026-10-20T01:00:00Z';expect((await service().discover({dateWib:'2026-10-20'})).trips).toEqual([]);});
it('rejects invalid calendar dates before candidate reads',async()=>{await expect(service().discover({dateWib:'2026-02-30'})).rejects.toMatchObject({code:'validation'});expect(candidates).not.toHaveBeenCalled();});
it('discovers upcoming active trips when no specific date filter is applied',async()=>{
 const result=await service().discoverUpcoming(10);
 expect(upcoming).toHaveBeenCalledWith(11);
 expect(result.trips).toHaveLength(1);
 expect(result.candidateLimitReached).toBe(false);
});
it('selects only active published full routes with a bounded deterministic SQL query',async()=>{let query='';let values:unknown[]=[];const client=Object.assign(async(strings:TemplateStringsArray,...params:unknown[])=>{query=strings.join('?');values=params;return [];},{});await createInventoryRepository(client as never).discoveryCandidates('start','end',51);expect(query).toContain("c.status='ACTIVE'");expect(query).toContain("t.status='OPEN_FOR_SALE'");expect(query).toContain('order by a.departure_at,t.id');expect(query).toContain('limit');expect(query).toContain('clock_timestamp()');expect(values).toEqual(['start','end',51]);});
it('enriches SearchResult with snapshot identity, stop count, intermediate stops, capacity, and cutoff', async () => {
 snapshot = {
  trip: {
   id: 'trip',
   status: 'OPEN_FOR_SALE',
   salesCloseAt: null,
   name: 'Cianjur Pagi',
   identity: {
    routeName: 'Bandung - Bogor Via Cianjur',
    vehicleName: 'HiAce Commuter',
    plateNumber: 'D 1234 AB',
    className: 'Eksekutif',
   },
  },
  companyName: 'Demo PO A',
  companyStatus: 'ACTIVE',
  serverNow: '2026-10-20T00:00:00Z',
  stops: [
   { id: 'origin', sequence: 0, name: 'Pasteur', city: 'Bandung', address: 'Jl. Djunjunan 1', departureAt: '2026-10-20T01:00:00Z', arrivalAt: '2026-10-20T01:00:00Z' },
   { id: 'mid', sequence: 1, name: 'Terminal Cianjur', city: 'Cianjur', address: 'Jl. KH Abdullah', departureAt: '2026-10-20T02:15:00Z', arrivalAt: '2026-10-20T02:10:00Z' },
   { id: 'destination', sequence: 2, name: 'Baranangsiang', city: 'Bogor', address: 'Jl. Pajajaran', departureAt: '2026-10-20T03:30:00Z', arrivalAt: '2026-10-20T03:30:00Z' },
  ],
  segments: [
   { sequence: 0, price: '25000', currency: 'IDR' },
   { sequence: 1, price: '35000', currency: 'IDR' },
  ],
  seats: [{ id: 'free' }, { id: 'held' }],
  anchors: [
   { seatId: 'free', sequence: 0 },
   { seatId: 'free', sequence: 1 },
   { seatId: 'held', sequence: 0 },
   { seatId: 'held', sequence: 1 },
  ],
  holds: [{ seatId: 'held', from: 0, to: 2 }],
  booked: [],
  layout: null,
  inventoryCount: 4,
 } as unknown as Snapshot;

 const result = await service().discover({ dateWib: '2026-10-20' });
 expect(result.trips[0]).toMatchObject({
  routeName: 'Bandung - Bogor Via Cianjur',
  vehicleName: 'HiAce Commuter',
  plateNumber: 'D 1234 AB',
  seatCapacity: 2,
  stopCount: 3,
  intermediateStops: ['Terminal Cianjur'],
  originCity: 'Bandung',
  originAddress: 'Jl. Djunjunan 1',
  destinationCity: 'Bogor',
  destinationAddress: 'Jl. Pajajaran',
  cutoff: '2026-10-20T01:00:00Z',
 });
 expect((await service().networkCatalog())).toEqual({ routes: [], classes: [] });
});
it('queries stop addresses in locations() and active companies/routes/classes in networkCatalog()', async () => {
 const queries: string[] = [];
 const client = Object.assign(async (strings: TemplateStringsArray) => {
  const sql = strings.join('?');
  queries.push(sql);
  if (sql.includes('from public.routes r')) {
   return [{
    id: 'route-1',
    companyName: 'Demo PO A',
    name: 'Bandung - Bogor',
    code: 'BDG-BGR',
    stops: [{ stopId: 's1', name: 'Pasteur', city: 'Bandung', address: 'Jl. Djunjunan 1' }],
    minSegmentFare: '25000',
    openTripCount: 2,
   }];
  }
  if (sql.includes('from public.service_classes sc')) {
   return [{ name: 'Eksekutif', code: 'EXC' }];
  }
  return [];
 }, {});

 const repo = createInventoryRepository(client as never);
 expect(await repo.locations()).toEqual([]);
 expect(queries[0]).toContain('s.address');
 expect(queries[1]).toContain('s.address');

 const catalog = await repo.networkCatalog();
 expect(catalog).toEqual({
  routes: [{
   id: 'route-1',
   companyName: 'Demo PO A',
   name: 'Bandung - Bogor',
   code: 'BDG-BGR',
   stops: [{ stopId: 's1', name: 'Pasteur', city: 'Bandung', address: 'Jl. Djunjunan 1' }],
   minSegmentFare: '25000',
   openTripCount: 2,
  }],
  classes: [{ name: 'Eksekutif', code: 'EXC' }],
 });
 expect(queries[2]).toContain("c.status='ACTIVE'");
 expect(queries[2]).toContain("r.status='ACTIVE'");
 expect(queries[2]).toContain("s.status='ACTIVE'");
 expect(queries[2]).toContain("sc.status='ACTIVE'");
 expect(queries[2]).toContain("t.status='OPEN_FOR_SALE'");
 expect(queries[2]).toContain('clock_timestamp()');
 expect(queries[3]).toContain("sc.status='ACTIVE'");
 expect(queries[3]).toContain("c.status='ACTIVE'");
});
