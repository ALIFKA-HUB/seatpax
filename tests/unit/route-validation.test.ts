import {it,expect} from 'vitest';
import {parseRoute,parseStop,parseClass} from '@/modules/route/validation';
const a='10000000-0000-4000-8000-000000000001',b='10000000-0000-4000-8000-000000000002';
const input={name:' Route ',code:null,stops:[{stopId:a,arrivalOffsetMin:0,departureOffsetMin:0},{stopId:b,arrivalOffsetMin:60,departureOffsetMin:60}]};
it('normalizes valid route',()=>expect(parseRoute(input).name).toBe('Route'));
it.each([{...input,stops:input.stops.slice(0,1)},{...input,stops:[input.stops[0],input.stops[0]]},{...input,stops:[input.stops[1],input.stops[0]]},{...input,name:''}])('rejects invalid route %j',v=>expect(()=>parseRoute(v)).toThrow());
it('rejects invalid offset ranges/fractions',()=>{expect(()=>parseRoute({...input,stops:[{...input.stops[0],departureOffsetMin:-1},input.stops[1]]})).toThrow();expect(()=>parseRoute({...input,stops:[{...input.stops[0],departureOffsetMin:0.5},input.stops[1]]})).toThrow();});
it('normalizes master data and bounds code',()=>{expect(parseStop({name:' Stop ',regionRegencyId:null,address:null,status:'ACTIVE'}).name).toBe('Stop');expect(parseClass({name:'Executive',code:'executive',status:'ACTIVE'}).code).toBe('executive');expect(()=>parseClass({name:'Executive',code:'BAD CODE',status:'ACTIVE'})).toThrow();});
