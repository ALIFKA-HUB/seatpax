import type {Sql} from 'postgres';
import type {DomainTx} from '@/modules/access/transaction';
import {createHash} from 'node:crypto';
import {decryptToken,encryptToken,createTicketToken,type TicketKeys} from './crypto';
type Tx=Sql|DomainTx;
type Record={id:string;tokenHash:string;ciphertext:string;nonce:string;authTag:string;keyVersion:string};
export function createTicketRepository(){return {
 async issue(tx:Tx,input:{passengerId:string;assignmentId:string;companyId:string;tripId:string;keys:TicketKeys;keyVersion:string}):Promise<{id:string;token:string}>{
  const old=await tx<Record[]>`select id,token_hash as "tokenHash",ciphertext,nonce,auth_tag as "authTag",key_version as "keyVersion" from public.tickets where booking_passenger_id=${input.passengerId} for update`;
  if(old.length)return {id:old[0].id,token:decryptToken(old[0],input.keys)};
  const encrypted=encryptToken(createTicketToken(),input.keyVersion,input.keys);
  const rows=await tx<{id:string}[]>`insert into public.tickets(booking_passenger_id,assignment_id,trip_id,company_id,token_hash,ciphertext,nonce,auth_tag,key_version) values(${input.passengerId},${input.assignmentId},${input.tripId},${input.companyId},${encrypted.tokenHash},${encrypted.ciphertext},${encrypted.nonce},${encrypted.authTag},${encrypted.keyVersion}) returning id`;
  return {id:rows[0].id,token:encrypted.token};
 },
 async readToken(tx:Tx,id:string,keys:TicketKeys):Promise<string|null>{const rows=await tx<Record[]>`select id,token_hash as "tokenHash",ciphertext,nonce,auth_tag as "authTag",key_version as "keyVersion" from public.tickets where id=${id}`;return rows[0]?decryptToken(rows[0],keys):null;},
 async resolveHash(tx:Tx,token:string){return (await tx<{id:string}[]>`select id from public.tickets where token_hash=${createHash('sha256').update(token).digest('hex')}`)[0]??null;},
};}
