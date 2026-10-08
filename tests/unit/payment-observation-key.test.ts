import {it,expect} from 'vitest';
import {observationKey} from '@/modules/payment/observation-key';
const o={orderId:'o',transactionId:'t',merchantId:'m',amount:'20000',currency:'IDR' as const,status:'pending',fraudStatus:null,paymentType:'bank_transfer',verifiedAt:'2026-10-08T00:00:00Z'};
it('deduplicates identical authenticated transitions independently of fetch time',()=>{expect(observationKey(o)).toBe(observationKey({...o,verifiedAt:'2026-10-08T00:01:00Z'}));expect(observationKey(o)).not.toBe(observationKey({...o,status:'settlement'}));});
