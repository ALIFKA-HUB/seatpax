import { z } from 'zod';
import { DEV_PROJECT_REF } from '@/lib/env/migration';
const mappingSchema = z.object({adminA:z.uuid(),crewA:z.uuid(),adminB:z.uuid(),crewB:z.uuid(),superAdmin:z.uuid()}).strict();
export type SeedMapping = z.infer<typeof mappingSchema>;
export function parseSeedMapping(input:unknown):SeedMapping {
  const parsed = mappingSchema.safeParse(input);
  if (!parsed.success || new Set(Object.values(parsed.data).map(v=>v.toLowerCase())).size !== 5) throw new Error('Invalid seed mapping');
  return Object.fromEntries(Object.entries(parsed.data).map(([k,v])=>[k,v.toLowerCase()])) as SeedMapping;
}
export const DEMO_COMPANIES = [
  {id:'00000000-0000-4000-8000-000000000001',name:'Demo PO A',slug:'demo-po-a'},
  {id:'00000000-0000-4000-8000-000000000002',name:'Demo PO B',slug:'demo-po-b'},
] as const;
export function seedMemberships(mapping:SeedMapping) {
  return (['adminA','crewA','adminB','crewB','superAdmin'] as const).map((key,index)=>({
    id:`00000000-0000-4000-9000-00000000000${index+1}`,userId:mapping[key],
    role:key==='superAdmin'?'SUPER_ADMIN' as const:key.startsWith('admin')?'ADMIN_PO' as const:'CREW' as const,
    companyId:key==='superAdmin'?null:DEMO_COMPANIES[key.endsWith('A')?0:1].id,
  }));
}
export type SeedTransaction = {inspect(mapping:SeedMapping):Promise<void>;write(mapping:SeedMapping):Promise<void>};
export type SeedRepository = {transaction<T>(fn:(tx:SeedTransaction)=>Promise<T>):Promise<T>};
export async function seedDevelopment(config:{projectRef:string;mapping:SeedMapping;apply:boolean},repository:SeedRepository):Promise<{mode:'dry-run'|'apply';companies:number;memberships:number}> {
  if(config.projectRef!==DEV_PROJECT_REF) throw new Error('Invalid seed target');
  const mapping=parseSeedMapping(config.mapping);
  try {
    await repository.transaction(async tx=>{await tx.inspect(mapping);if(config.apply)await tx.write(mapping);});
    return {mode:config.apply?'apply':'dry-run',companies:2,memberships:5};
  } catch {throw new Error('Seed failed: verify existing Auth accounts and fixed demo identities');}
}
