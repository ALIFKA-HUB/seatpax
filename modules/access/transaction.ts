import type {Sql,TransactionSql} from 'postgres';
import {z} from 'zod';
export type Context={actorId:string;companyId:string};
export type DomainTx=TransactionSql;
export class DomainError extends Error {constructor(public code:'validation'|'forbidden'|'conflict'|'unavailable',message:string){super(message);}}
export async function withAdminTransaction<T>(client:Sql,context:Context,work:(tx:DomainTx)=>Promise<T>):Promise<T>{
  if(!z.uuid().safeParse(context.actorId).success||!z.uuid().safeParse(context.companyId).success)throw new DomainError('forbidden','Akses ditolak.');
  try{return await client.begin(async tx=>{
    const membership=await tx`select id from public.memberships where user_id=${context.actorId} and company_id=${context.companyId} and role='ADMIN_PO' and status='ACTIVE' for share`;
    if(membership.length!==1)throw new DomainError('forbidden','Akses PO ditolak.');
    return await work(tx);
  }) as Awaited<T>;}catch(error){if(error instanceof DomainError)throw error;throw new DomainError('unavailable','Data belum dapat disimpan. Coba lagi.');}
}
export async function listAdminCompanies(client:Sql,actorId:string):Promise<{id:string;name:string}[]>{
  return await client<{id:string;name:string}[]>`select c.id,c.name from public.companies c join public.memberships m on m.company_id=c.id where m.user_id=${actorId} and m.role='ADMIN_PO' and m.status='ACTIVE' order by c.name`;
}
