import {beforeEach,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({access:vi.fn(),resolve:vi.fn(),revalidate:vi.fn()}));
vi.mock('@/modules/access/server',()=>({requireAccess:f.access,AccessError:class AccessError extends Error{constructor(public reason:string){super(reason);}}}));
vi.mock('@/lib/db',()=>({getDatabase:()=>({$client:{}})}));
vi.mock('@/modules/payment/repository',()=>({createPaymentRepository:()=>({})}));
vi.mock('@/modules/payment/conflict-service',()=>({createConflictService:()=>({resolve:f.resolve})}));
vi.mock('next/cache',()=>({revalidatePath:f.revalidate}));
import {resolvePaymentConflictAction} from '@/app/admin/payment-actions';
import {AccessError} from '@/modules/access/server';
import {DomainError} from '@/modules/access/transaction';
const companyId='10000000-0000-4000-8000-000000000001';
const bookingId='10000000-0000-4000-8000-000000000002';
const userId='10000000-0000-4000-8000-000000000003';
beforeEach(()=>{vi.resetAllMocks();f.access.mockResolvedValue({userId,companyId});f.resolve.mockResolvedValue({id:bookingId,status:'REFUNDED'});});
it('validates the tenant, booking and reason before mutation',async()=>{
 expect(await resolvePaymentConflictAction('bad',bookingId,{action:'MOCK_REFUND',requestKey:bookingId,reason:'why'})).toMatchObject({ok:false,code:'validation'});
 expect(await resolvePaymentConflictAction(companyId,'bad',{action:'MOCK_REFUND',requestKey:bookingId,reason:'why'})).toMatchObject({ok:false,code:'validation'});
 expect(await resolvePaymentConflictAction(companyId,bookingId,{action:'MOCK_REFUND',requestKey:bookingId,reason:'  '})).toMatchObject({ok:false,code:'validation'});
 expect(f.resolve).not.toHaveBeenCalled();
});
it('uses fresh tenant authorization and forwards only validated resolution fields',async()=>{
 const result=await resolvePaymentConflictAction(companyId,bookingId,{action:'MOCK_REFUND',requestKey:bookingId,reason:'  paid after expiry  ',actorId:'evil'});
 expect(f.access).toHaveBeenCalledWith('tenant.admin',companyId);
 expect(f.resolve).toHaveBeenCalledWith({userId,companyId},bookingId,{action:'MOCK_REFUND',requestKey:bookingId,reason:'paid after expiry'});
 expect(result).toMatchObject({ok:true,data:{id:bookingId,status:'REFUNDED'}});
 expect(f.revalidate).toHaveBeenCalledWith(`/admin/companies/${companyId}/payment-conflicts`,'page');
});
it('preserves domain blockers and conceals access/database details',async()=>{
 f.resolve.mockRejectedValue(new DomainError('conflict','Interval sudah terisi.'));
 expect(await resolvePaymentConflictAction(companyId,bookingId,{action:'CONFIRM',requestKey:bookingId,reason:'reviewed'})).toMatchObject({ok:false,code:'conflict',message:'Interval sudah terisi.'});
 f.access.mockRejectedValue(new AccessError('forbidden'));
 expect(await resolvePaymentConflictAction(companyId,bookingId,{action:'CONFIRM',requestKey:bookingId,reason:'reviewed'})).toMatchObject({ok:false,code:'forbidden'});
 f.resolve.mockRejectedValue(Error('database secret'));
 expect(JSON.stringify(await resolvePaymentConflictAction(companyId,bookingId,{action:'CONFIRM',requestKey:bookingId,reason:'reviewed'}))).not.toContain('secret');
});
