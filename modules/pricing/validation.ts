export const MAX_PRICE=BigInt('9223372036854775807');
export function parsePrice(value:unknown):bigint {
  if(typeof value!=='string'||value.length>19||!/^\d+$/.test(value))throw new DomainError('validation','Harga harus bilangan rupiah utuh, minimal 0.');
  const price=BigInt(value);if(price>MAX_PRICE)throw new DomainError('validation','Harga melebihi batas yang didukung.');return price;
}
export function sumPrices(values:string[]):string {
  const total=values.reduce((a,v)=>a+parsePrice(v),BigInt(0));if(total>MAX_PRICE)throw new DomainError('validation','Total tarif melebihi batas yang didukung.');return total.toString();
}
import {DomainError} from '@/modules/access/transaction';
