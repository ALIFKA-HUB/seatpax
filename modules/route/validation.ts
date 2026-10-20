import {z} from 'zod';
const name=z.string().trim().min(1).max(120);
const code=z.string().trim().min(1).max(32).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const status=z.enum(['ACTIVE','INACTIVE']);
export const stopSchema=z.object({name,regionRegencyId:z.uuid().nullable(),address:z.string().trim().max(500).nullable(),status});
export const classSchema=z.object({name,code,status});
const offset=z.number().int().min(0).max(10080).nullable();
export const routeSchema=z.object({name,code:code.nullable(),stops:z.array(z.object({stopId:z.uuid(),arrivalOffsetMin:offset,departureOffsetMin:offset})).min(2).max(50)}).superRefine((value,ctx)=>{
  let previous=0;const ids=new Set<string>();
  value.stops.forEach((s,i)=>{
    if(ids.has(s.stopId))ctx.addIssue({code:'custom',path:['stops',i],message:'Stop tidak boleh berulang.'});ids.add(s.stopId);
    for(const v of [s.arrivalOffsetMin,s.departureOffsetMin])if(v!==null){if(v<previous)ctx.addIssue({code:'custom',path:['stops',i],message:'Waktu stop harus berurutan.'});previous=v;}
  });
});
export const parseStop=(v:unknown)=>stopSchema.parse(v);
export const parseClass=(v:unknown)=>classSchema.parse(v);
export const parseRoute=(v:unknown)=>routeSchema.parse(v);
export type RouteInput=z.infer<typeof routeSchema>;
