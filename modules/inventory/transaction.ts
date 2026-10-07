import type {Sql} from 'postgres';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
export function databaseCode(error:unknown):string|undefined{return typeof error==='object'&&error!==null&&'code' in error?String(error.code):undefined;}
export async function inventoryTransaction<T>(client:Sql,work:(tx:DomainTx)=>Promise<T>):Promise<T>{
 for(let attempt=0;attempt<2;attempt++)try{return await client.begin(async tx=>{await tx`set local lock_timeout='5s'`;await tx`set local statement_timeout='15s'`;return await work(tx);}) as Awaited<T>;}catch(error){if(error instanceof DomainError)throw error;const code=databaseCode(error);if(attempt===0&&['40P01','55P03','57014'].includes(code??''))continue;if(code==='23505')throw error;throw new DomainError('unavailable','Permintaan belum dapat dipastikan. Coba lagi dengan pilihan yang sama.');}
 throw new DomainError('unavailable','Coba lagi.');
}
