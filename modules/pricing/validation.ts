export const MAX_PRICE=BigInt('9223372036854775807');
export function parsePrice(value:unknown):bigint {
  if(typeof value!=='string'||value.length>19||!/^\d+$/.test(value))throw new Error('validation');
  const price=BigInt(value);if(price>MAX_PRICE)throw new Error('validation');return price;
}
export function sumPrices(values:string[]):string {
  const total=values.reduce((a,v)=>a+parsePrice(v),BigInt(0));if(total>MAX_PRICE)throw new Error('validation');return total.toString();
}
