import {mkdir,open} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import type {Sql} from 'postgres';
import {DEV_PROJECT_REF} from '@/lib/env/migration';
import {DomainError} from '@/modules/access/transaction';
import {withSuperAdminTransaction} from './transaction';
import {canonical,createFixtureMaintenanceRepository,digest,FIXTURE_IDS} from './fixture-maintenance-repository';

const companySchema=z.object({id:z.uuid(),name:z.literal('Trip fixture'),slug:z.string(),status:z.enum(['ACTIVE','SUSPENDED']),statusRevision:z.number().int().nonnegative(),target:z.literal('SUSPENDED')}).strict();
const manifestSchema=z.object({version:z.literal(1),projectRef:z.literal(DEV_PROJECT_REF),preparedAt:z.iso.datetime(),digest:z.string().regex(/^[a-f0-9]{64}$/),companies:z.array(companySchema).length(8),backupDigest:z.string().regex(/^[a-f0-9]{64}$/),protectedDigest:z.string().regex(/^[a-f0-9]{64}$/),activeHoldCount:z.literal(0),livePaymentHoldCount:z.literal(0)}).strict();
export type FixtureCleanupManifest=z.infer<typeof manifestSchema>;
const initialSuspended='a0315534-d5b2-4e43-b3a0-5b2237f115a4';
const transactionFixtures=new Set([initialSuspended,'a123531d-143d-4e15-a4a5-9f0c5cf4775d']);
function conflict():never {throw new DomainError('conflict','Fixture preflight changed. Prepare and review a new manifest.');}
export function parseFixtureManifest(raw:unknown):FixtureCleanupManifest {
 const manifest=manifestSchema.parse(raw);
 const {digest:claimed,...content}=manifest;
 if(digest(content)!==claimed||manifest.companies.some((c,i)=>c.id!==FIXTURE_IDS[i]||c.slug!==`trip-${c.id}`||c.statusRevision!==0||c.status!==(c.id===initialSuspended?'SUSPENDED':'ACTIVE')))conflict();
 return manifest;
}
export async function prepareFixtureCleanup(client:Sql):Promise<FixtureCleanupManifest> {
 const repo=createFixtureMaintenanceRepository(client);
 const state=await client.begin('isolation level repeatable read read only',tx=>repo.inspect(tx));
 if(state.companyRows.length!==8||state.activeHoldCount||state.livePaymentHoldCount)conflict();
 for(const id of FIXTURE_IDS)for(const table of ['bookings','payments','tickets'])if(state.counts[table][id]!==((table!=='tickets'&&transactionFixtures.has(id))?1:0))conflict();
 const content={version:1 as const,projectRef:DEV_PROJECT_REF,preparedAt:new Date().toISOString(),companies:state.companyRows.map(c=>({id:c.id,name:c.name,slug:c.slug,status:c.status,statusRevision:c.status_revision,target:'SUSPENDED' as const})),backupDigest:digest({companies:state.companyRows}),protectedDigest:state.protectedDigest,activeHoldCount:0 as const,livePaymentHoldCount:0 as const};
 return parseFixtureManifest({...content,digest:digest(content)});
}
export function validateFixtureBackup(manifest:FixtureCleanupManifest,companyRows:unknown[]) {
 const parsed=companyRows.map(r=>z.object({id:z.uuid(),name:z.string(),slug:z.string(),status:z.string(),status_revision:z.number()}).passthrough().parse(r)).sort((a,b)=>a.id.localeCompare(b.id));
 if(parsed.length!==8||parsed.some((c,i)=>{const m=manifest.companies[i];return c.id!==m.id||c.name!==m.name||c.slug!==m.slug||c.status!==m.status||c.status_revision!==m.statusRevision;}))conflict();
 if(digest({companies:companyRows})!==manifest.backupDigest)conflict();
}
export async function writeFixtureBackup(manifest:FixtureCleanupManifest,companyRows:unknown[]) {
 parseFixtureManifest(manifest);
 validateFixtureBackup(manifest,companyRows);
 const dir=path.resolve('.seatpax/fixture-cleanup');await mkdir(dir,{recursive:true,mode:0o700});
 const manifestPath=path.join(dir,`${manifest.digest}.manifest.json`),backupPath=path.join(dir,`${manifest.digest}.backup.json`);
 const backup={manifest,companies:companyRows},backupDigest=manifest.backupDigest;
 for(const [file,content] of [[backupPath,canonical(backup)],[manifestPath,canonical(manifest)]] as const){const handle=await open(file,'wx',0o600);try{await handle.writeFile(content+'\n');await handle.sync();}finally{await handle.close();}}
 return {manifestPath,backupPath,backupDigest};
}
export async function applyReviewedFixtureCleanup(userId:string,raw:FixtureCleanupManifest,repo:ReturnType<typeof createFixtureMaintenanceRepository>):Promise<{changed:{id:string;statusRevision:number}[];unchanged:string[]}> {
 const manifest=parseFixtureManifest(raw);
 return withSuperAdminTransaction(repo.company,userId,async tx=>{
  for(const c of manifest.companies)await repo.company.company(tx,c.id);
  await repo.lockProtected(tx);
  const current=await repo.inspect(tx),events=await repo.events(tx);
  if(current.protectedDigest!==manifest.protectedDigest||current.activeHoldCount||current.livePaymentHoldCount)conflict();
  const initial=current.companyRows.every((c,i)=>c.status===manifest.companies[i].status&&c.status_revision===manifest.companies[i].statusRevision);
  if(!initial){
   const applied=current.companyRows.every((c,i)=>{const m=manifest.companies[i];const changed=m.status==='ACTIVE';return c.status==='SUSPENDED'&&c.status_revision===m.statusRevision+(changed?1:0)&&(!changed||events.filter(e=>e.company_id===c.id).length===1&&events.some(e=>e.company_id===c.id&&e.actor_user_id===userId&&e.from_status==='ACTIVE'&&e.to_status==='SUSPENDED'&&e.status_revision===c.status_revision));});
   if(!applied||events.length!==7||events.some(e=>e.company_id===initialSuspended))conflict();
   return {changed:[],unchanged:manifest.companies.map(c=>c.id)};
  }
  if(events.length)conflict();
  const changed:{id:string;statusRevision:number}[]=[],unchanged:string[]=[];
  for(const c of manifest.companies){
   if(c.status==='SUSPENDED'){unchanged.push(c.id);continue;}
   const updated=await repo.company.update(tx,c.id,'SUSPENDED',c.statusRevision+1);
   await repo.company.audit(tx,{companyId:c.id,actorId:userId,fromStatus:c.status,toStatus:'SUSPENDED',statusRevision:updated.statusRevision});
   changed.push({id:c.id,statusRevision:updated.statusRevision});
  }
  return {changed,unchanged};
 });
}
