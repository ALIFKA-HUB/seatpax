import { DomainError } from '@/modules/access/transaction';
export function parseWibInstant(input:string):string {
 const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(input);
 if(!match)throw new DomainError('validation','Gunakan tanggal dan jam WIB yang valid.');
 const [year,month,day,hour,minute]=match.slice(1).map(Number);
 const local=new Date(Date.UTC(year,month-1,day,hour,minute));
 if(year<2000||year>9999||local.getUTCFullYear()!==year||local.getUTCMonth()!==month-1||local.getUTCDate()!==day||local.getUTCHours()!==hour||local.getUTCMinutes()!==minute)throw new DomainError('validation','Tanggal atau jam WIB tidak valid.');
 return new Date(local.getTime()-7*3600000).toISOString();
}
export function toWibInput(iso:string):string {return new Date(Date.parse(iso)+7*3600000).toISOString().slice(0,16);}
export function intervalCutoff(originDepartureIso:string,globalIso:string|null):string {return globalIso&&Date.parse(globalIso)<Date.parse(originDepartureIso)?globalIso:originDepartureIso;}
