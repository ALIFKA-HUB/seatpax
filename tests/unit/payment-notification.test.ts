import {it,expect} from 'vitest';
import {createPaymentNotificationService} from '@/modules/payment/notification-service';
import {createMidtransProvider} from '@/modules/payment/midtrans-provider';
import {createHash} from 'node:crypto';
const provider=createMidtransProvider({serverKey:'SB-Mid-server-test',clientKey:'SB-Mid-client-test',merchantId:'GTEST',keys:{v1:Buffer.alloc(32)},keyVersion:'v1'});
function notice(status='pending') {const body={order_id:'seatpax-abc',transaction_id:'txn-1',transaction_status:status,status_code:'200',gross_amount:'20000.00',merchant_id:'GTEST',currency:'IDR',fraud_status:'accept',payment_type:'bank_transfer'};return {...body,signature_key:createHash('sha512').update(body.order_id+body.status_code+body.gross_amount+'SB-Mid-server-test').digest('hex')};}
it('keeps unsigned status changes distinct for reconciliation while rejecting malformed signatures',()=>{
 const a=provider.authenticate(notice('pending')),b=provider.authenticate(notice('settlement'));
 expect(a.eventKey).not.toBe(b.eventKey);
 // Midtrans signature omits transaction_status. Authentication is only receipt acceptance;
 // the event processor must obtain authenticated GET Status before applying any outcome.
 expect(provider.authenticate({...notice(),transaction_status:'settlement'}).fields.transaction_status).toBe('settlement');
 expect(()=>provider.authenticate({...notice(),signature_key:'0'.repeat(128)})).toThrow();
});
it('caps accepted request body at 64 KiB before parsing or persistence',async()=>{
 let persisted=false;const service=createPaymentNotificationService(provider,{receive:async()=>{persisted=true;return {receiptId:'x',duplicate:false};}});
 await expect(service.receive({body:'x'.repeat(65537)})).rejects.toMatchObject({code:'validation'});expect(persisted).toBe(false);
 await expect(service.receive('{malformed')).rejects.toMatchObject({code:'validation'});expect(persisted).toBe(false);
 await expect(service.receive({transaction_status:'settlement'})).rejects.toMatchObject({code:'validation'});expect(persisted).toBe(false);
});
