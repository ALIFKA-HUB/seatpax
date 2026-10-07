import {it,expect} from 'vitest';
import {parsePrice,sumPrices} from '@/modules/pricing/validation';
it('keeps bigint precision and accepts zero',()=>{expect(sumPrices(['9007199254740993','0','2'])).toBe('9007199254740995');expect(parsePrice('0')).toBe(BigInt(0));});
it.each(['-1','1.5','1e3','','9223372036854775808'])('rejects invalid price %s',p=>expect(()=>parsePrice(p)).toThrow());
it('rejects overflowing total',()=>expect(()=>sumPrices(['9223372036854775807','1'])).toThrow());
