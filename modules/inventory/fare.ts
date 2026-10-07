import {DomainError} from '@/modules/access/transaction';
import type {TripSegmentSnapshot} from '@/modules/trip/types';import type {Range} from './types';
export function quoteInterval(segments:TripSegmentSnapshot[],range:Range):string{let sum=BigInt(0);for(let seq=range.from;seq<range.to;seq++){const rows=segments.filter(s=>s.sequence===seq);if(rows.length!==1||rows[0].currency!=='IDR'||!/^\d+$/.test(rows[0].price))throw new DomainError('unavailable','Tarif perjalanan belum lengkap.');sum+=BigInt(rows[0].price);}return sum.toString();}
