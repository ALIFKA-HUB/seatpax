import {expect,it,vi} from 'vitest';
import type {Sql} from 'postgres';
import {scopedPaymentClient} from '../integration/helpers/scoped-payment-client';
const company='00000000-0000-4000-8000-000000000001';
it('scopes both maintenance selectors while preserving bound values',async()=>{
 const call=vi.fn(async()=>[]),client=scopedPaymentClient(call as unknown as Sql,company);
 await client`select id from public.payment_events where status='RECEIVED' order by received_at limit ${1}`;
 await client`select p.id as "paymentId",p.provider_order_id as "orderId" from public.payments p where p.status<>'PAID' order by p.created_at limit ${2}`;
 await client`select id,held_by_user_id as "ownerId" from public.seat_holds where status='ACTIVE' order by effective_expires_at limit ${3}`;
 expect(call.mock.calls).toHaveLength(3);
 const calls=call.mock.calls as unknown as [TemplateStringsArray,number][];
 expect(calls[0][0].join('?')).toContain(`payment_id in (select id from public.payments where company_id='${company}'::uuid)`);
 expect(calls[1][0].join('?')).toContain(`p.company_id='${company}'::uuid`);
 expect(calls[2][0].join('?')).toContain(`company_id='${company}'::uuid`);
 expect(calls.map(c=>c[1])).toEqual([1,2,3]);
});
it('leaves normal domain queries unchanged',async()=>{
 const call=vi.fn(async()=>[]),client=scopedPaymentClient(call as unknown as Sql,company);
 await client`select id from public.payments where provider_order_id=${'order-test'}`;
 expect((call.mock.calls as unknown as [TemplateStringsArray,string][])[0][0].join('?')).not.toContain('company_id');
});
