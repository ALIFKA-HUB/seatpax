import {DomainError} from '@/modules/access/transaction';
import {ProviderError} from './midtrans-provider';
import type {AuthenticatedReceipt,PaymentProvider} from './types';
export type ReceiptStore={receive(receipt:AuthenticatedReceipt):Promise<{receiptId:string;duplicate:boolean}>};
export function createPaymentNotificationService(provider:Pick<PaymentProvider,'authenticate'>,store:ReceiptStore){return {async receive(raw:unknown){
  let bytes:number;try{bytes=Buffer.byteLength(typeof raw==='string'?raw:JSON.stringify(raw),'utf8');}catch{throw new DomainError('validation','Notifikasi tidak valid.');}
  if(bytes>65536)throw new DomainError('validation','Notifikasi terlalu besar.');
  let body=raw;if(typeof raw==='string'){try{body=JSON.parse(raw);}catch{throw new DomainError('validation','Notifikasi tidak valid.');}}
  let receipt:AuthenticatedReceipt;try{receipt=provider.authenticate(body);}catch(error){if(error instanceof ProviderError&&error.kind==='INVALID')throw new DomainError('validation','Notifikasi tidak valid.');throw new DomainError('forbidden','Autentikasi notifikasi gagal.');}
  return store.receive(receipt);
 }};}
