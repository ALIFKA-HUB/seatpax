import {describe,expect,it,vi} from 'vitest';
import {createCheckoutActions} from '@/app/checkout/action-core';

describe('checkout actions',()=>{
 it('uses only the verified server identity and server-derived hold quote',async()=>{
  const initiate=vi.fn().mockResolvedValue({id:'b',status:'PENDING_PAYMENT'});
  const prepare=vi.fn().mockResolvedValue({state:'UNAVAILABLE'});
  const readHold=vi.fn().mockResolvedValue({record:{id:'h',ownerId:'u'},fare:'12000'});
  const actions=createCheckoutActions({getActor:async()=>({userId:'u',verifiedEmail:'u@example.test'}),readHold,initiate,prepare,readBooking:vi.fn(),paymentEnabled:true});
  await actions.start({holdId:'22222222-2222-4222-8222-222222222222',requestKey:'11111111-1111-4111-8111-111111111111',mode:'OTHER',name:'Ayu',phone:'0812345678',userId:'attacker'});
  expect(initiate).toHaveBeenCalledWith({userId:'u',verifiedEmail:'u@example.test'},{holdId:'22222222-2222-4222-8222-222222222222',requestKey:'11111111-1111-4111-8111-111111111111',mode:'OTHER',name:'Ayu',phone:'0812345678'});
  expect(readHold).toHaveBeenCalledWith('u','22222222-2222-4222-8222-222222222222');
  expect(prepare).toHaveBeenCalledWith('u','b');
 });
 it('rejects missing SELF details before creating a booking',async()=>{
  const initiate=vi.fn();
  const actions=createCheckoutActions({getActor:async()=>({userId:'u',verifiedEmail:'u@example.test'}),readHold:vi.fn(),initiate,prepare:vi.fn(),readBooking:vi.fn(),paymentEnabled:true});
  const result=await actions.start({holdId:'h',requestKey:'11111111-1111-4111-8111-111111111111',mode:'SELF',name:'',phone:''});
  expect(result.ok).toBe(false);
  expect(initiate).not.toHaveBeenCalled();
 });
 it('does not create a booking or expose initiation when Sandbox configuration is incomplete',async()=>{
  const initiate=vi.fn(),readHold=vi.fn();const actions=createCheckoutActions({getActor:async()=>({userId:'u',verifiedEmail:'u@example.test'}),readHold,initiate,prepare:vi.fn(),readBooking:vi.fn(),paymentEnabled:false});
  const result=await actions.start({holdId:'22222222-2222-4222-8222-222222222222',requestKey:'11111111-1111-4111-8111-111111111111',mode:'SELF',name:'A',phone:'0812345678'});
  expect(result.ok).toBe(false);expect(readHold).not.toHaveBeenCalled();expect(initiate).not.toHaveBeenCalled();
 });
});
