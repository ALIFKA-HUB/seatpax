import {z} from 'zod';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
import type {CompanyRepository} from './repository';

export async function withSuperAdminTransaction<T>(repo:CompanyRepository,userId:string,work:(tx:DomainTx)=>Promise<T>):Promise<T> {
 if(!z.uuid().safeParse(userId).success)throw new DomainError('forbidden','Akses Super Admin ditolak.');
 try{return await repo.client.begin(async tx=>{
  await tx`set local lock_timeout='5s'`;await tx`set local statement_timeout='15s'`;
  if(!await repo.authorize(tx,userId))throw new DomainError('forbidden','Akses Super Admin ditolak.');
  return work(tx);
 }) as Awaited<T>;}catch(error){if(error instanceof DomainError)throw error;throw new DomainError('unavailable','Status PO belum dapat diproses. Coba lagi.');}
}
