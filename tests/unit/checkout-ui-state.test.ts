import {describe,expect,it} from 'vitest';
import {checkoutIntent,paymentCallbackState,popupClosedState,pollingTerminal,passengerForMode} from '@/app/checkout/ui-state';

describe('checkout UI state',()=>{
 it('starts OTHER with empty passenger details and restores SELF profile without mutation',()=>{const profile={name:'Booker',phone:'+628123456789'};expect(passengerForMode('OTHER',profile)).toEqual({name:'',phone:''});expect(passengerForMode('SELF',profile)).toEqual(profile);expect(profile.name).toBe('Booker');});
 it('retains the request key only while retrying the same payload',()=>{
  const first=checkoutIntent(null,'OTHER|Ayu|0812345678');
  expect(checkoutIntent(first,'OTHER|Ayu|0812345678').requestKey).toBe(first.requestKey);
  expect(checkoutIntent(first,'OTHER|Budi|0812345678').requestKey).not.toBe(first.requestKey);
 });
 it('treats provider callbacks as a request to refresh server state',()=>{
  expect(paymentCallbackState('PENDING_PAYMENT')).toEqual({refresh:true,status:'PENDING_PAYMENT'});
 });
 it('keeps a closed Snap popup pending until server state changes',()=>{
  expect(popupClosedState('PENDING_PAYMENT')).toBe('PENDING_PAYMENT');
 });
 it('stops polling only for terminal booking states',()=>{
  expect(pollingTerminal('CONFIRMED')).toBe(true);
  expect(pollingTerminal('PAYMENT_CONFLICT')).toBe(true);
  expect(pollingTerminal('PENDING_PAYMENT')).toBe(false);
 });
});
