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
const candidates=vi.fn(),read=vi.fn();
const service=()=>createAvailabilityService({client:{},discoveryCandidates:candidates,snapshot:read} as unknown as InventoryRepository);
beforeEach(()=>{snapshot=fixture();candidates.mockReset().mockResolvedValue([row]);read.mockReset().mockImplementation(async()=>snapshot);});
it('discovers real full-route fare, holds and nullable arrival within a WIB day',async()=>{
 const result=await service().discover({dateWib:'2026-10-20'});
 expect(candidates).toHaveBeenCalledWith('2026-10-19T17:00:00.000Z','2026-10-20T17:00:00.000Z',51);
 expect(result.trips[0]).toMatchObject({fare:'60000',availableCount:1,fromStopId:'origin',toStopId:'destination',arrivalAt:null});
 expect(JSON.stringify(result)).not.toContain('held');
});
it('caps snapshot reads and reports truncation honestly',async()=>{candidates.mockResolvedValue(Array.from({length:51},()=>row));const result=await service().discover({dateWib:'2026-10-20'});expect(result.trips).toHaveLength(50);expect(read).toHaveBeenCalledTimes(50);expect(result.candidateLimitReached).toBe(true);});
it('does not advertise closed or suspended snapshots',async()=>{snapshot.companyStatus='SUSPENDED';expect((await service().discover({dateWib:'2026-10-20'})).trips).toEqual([]);snapshot.companyStatus='ACTIVE';snapshot.serverNow='2026-10-20T01:00:00Z';expect((await service().discover({dateWib:'2026-10-20'})).trips).toEqual([]);});
it('rejects invalid calendar dates before candidate reads',async()=>{await expect(service().discover({dateWib:'2026-02-30'})).rejects.toMatchObject({code:'validation'});expect(candidates).not.toHaveBeenCalled();});
it('selects only active published full routes with a bounded deterministic SQL query',async()=>{let query='';let values:unknown[]=[];const client=Object.assign(async(strings:TemplateStringsArray,...params:unknown[])=>{query=strings.join('?');values=params;return [];},{});await createInventoryRepository(client as never).discoveryCandidates('start','end',51);expect(query).toContain("c.status='ACTIVE'");expect(query).toContain("t.status='OPEN_FOR_SALE'");expect(query).toContain('order by a.departure_at,t.id');expect(query).toContain('limit');expect(query).toContain('clock_timestamp()');expect(values).toEqual(['start','end',51]);});
