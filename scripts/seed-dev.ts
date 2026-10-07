import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { parseMigrationEnvironment } from '../lib/env/migration';
import { seedDevelopment,parseSeedMapping } from '../modules/access/seed';
import { createSeedRepository } from '../modules/access/seed-repository';
config({path:'.env.local',quiet:true});
async function main(){
  if(process.argv.slice(2).some(arg=>arg!=='--apply'))throw new Error('Invalid command');
  const target=parseMigrationEnvironment(process.env);
  const mapping=parseSeedMapping(JSON.parse(await readFile('.seatpax/seed-accounts.json','utf8')));
  const client=postgres(target.url,{ssl:{rejectUnauthorized:true},prepare:false,max:1,connect_timeout:5});
  try {console.log(await seedDevelopment({...target,mapping,apply:process.argv.includes('--apply')},createSeedRepository(client)));}
  finally {await client.end({timeout:5});}
}
main().catch(()=>{console.error('Development seed failed. Check target, mapping and existing identities.');process.exitCode=1;});
