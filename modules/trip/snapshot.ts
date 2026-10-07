import { DomainError } from '@/modules/access/transaction';
import { parseTemplate } from '@/modules/fleet/validation';
import { parseWibInstant } from './time';
import type { PublicationSource, PublicationProjection, TripDraftInput } from './types';
export function projectSnapshot(source:PublicationSource,draft:TripDraftInput,nowIso:string):PublicationProjection {
 const fail=(message:string):never=>{throw new DomainError('validation',message);};
 if([source.route.status,source.vehicle.status,source.serviceClass.status,source.template.status].some(s=>s!=='ACTIVE')||source.stops.some(s=>s.status!=='ACTIVE'))fail('Semua sumber trip harus aktif.');
 const start=Date.parse(parseWibInstant(draft.departureWib));
 if(start<=Date.parse(nowIso))fail('Keberangkatan harus masih di masa depan.');
 if(source.stops.length<2||source.stops.length>50||new Set(source.stops.map(s=>s.stopId)).size!==source.stops.length)fail('Rute memerlukan 2–50 stop unik.');
 let previous=-1;
 const stops=source.stops.map((s,i)=>{
  if(s.sequence!==i+1)fail('Urutan stop tidak lengkap.');
  if(i===0&&s.departureOffsetMin!==0)fail('Offset keberangkatan stop pertama harus 0.');
  const arrival=s.arrivalOffsetMin??(i===0?s.departureOffsetMin:null);
  const departure=s.departureOffsetMin??(i===source.stops.length-1?s.arrivalOffsetMin:null);
  if(arrival===null||departure===null)fail('Lengkapi waktu tiba dan berangkat setiap stop.');
  const a=arrival as number,d=departure as number;
  if(!Number.isInteger(a)||!Number.isInteger(d)||a<0||d>10080||a>d||a<previous)fail('Offset jadwal harus berurutan dan valid.');
  previous=d;return {sourceId:s.sourceId,stopId:s.stopId,name:s.name,city:s.city,address:s.address,sequence:s.sequence,arrivalAt:new Date(start+a*60000).toISOString(),departureAt:new Date(start+d*60000).toISOString()};
 });
 if(draft.salesCloseWib){const cutoff=Date.parse(parseWibInstant(draft.salesCloseWib));if(cutoff<=Date.parse(nowIso)||cutoff>Date.parse(stops.at(-1)!.departureAt))fail('Batas penjualan harus setelah sekarang dan paling lambat keberangkatan stop terakhir.');}
 const segments=source.stops.slice(0,-1).map((s,i)=>{
  const matches=source.fares.filter(f=>f.fromSourceId===s.sourceId&&f.toSourceId===source.stops[i+1].sourceId);
  if(matches.length!==1||matches[0].currency!=='IDR'||!/^\d+$/.test(matches[0].price)||BigInt(matches[0].price)>9223372036854775807n)fail('Tarif segmen belum lengkap atau tidak valid.');
  return {sequence:i+1,fromSequence:i+1,toSequence:i+2,price:BigInt(matches[0].price).toString(),currency:'IDR' as const};
 });
 const validated=parseTemplate({...source.layout,name:'Trip layout'});
 const layout={rows:validated.rows,cols:validated.cols,cells:validated.cells};
 return {stops,segments,layout,seats:layout.cells.filter(c=>c.type==='SEAT').map(c=>({seatCode:c.seatCode!,rowIndex:c.rowIndex,colIndex:c.colIndex,label:c.label})),identity:{routeName:source.route.name,routeCode:source.route.code,routeRevision:source.route.revision,vehicleName:source.vehicle.name,plateNumber:source.vehicle.plateNumber,vehicleRevision:source.vehicle.revision,className:source.serviceClass.name,classCode:source.serviceClass.code,templateId:source.template.id,templateVersion:source.template.version}};
}
