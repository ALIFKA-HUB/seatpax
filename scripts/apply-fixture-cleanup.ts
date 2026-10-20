import {config} from 'dotenv';
import {readFile,open} from 'node:fs/promises';
import path from 'node:path';
import {createDatabaseConnection} from '../lib/db/connection';
import {parseMigrationEnvironment} from '../lib/env/migration';
import {parseSeedMapping} from '../modules/access/seed';
import {applyReviewedFixtureCleanup,parseFixtureManifest,validateFixtureBackup} from '../modules/company/fixture-maintenance';
import {createFixtureMaintenanceRepository,digest} from '../modules/company/fixture-maintenance-repository';
config({path:'.env.local',quiet:true});
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--manifest'||args[2]!=='--digest'||!/^[a-f0-9]{64}$/.test(args[3]))throw new Error('Invalid arguments');
 const manifestPath=path.resolve(args[1]),directory=path.resolve('.seatpax/fixture-cleanup');
 if(path.dirname(manifestPath)!==directory||path.basename(manifestPath)!==`${args[3]}.manifest.json`)throw new Error('Unreviewed file');
 const manifest=parseFixtureManifest(JSON.parse(await readFile(manifestPath,'utf8')));
 if(manifest.digest!==args[3])throw new Error('Unreviewed digest');
 const backup=JSON.parse(await readFile(path.join(directory,`${manifest.digest}.backup.json`),'utf8'));
 if(digest(backup.manifest)!==digest(manifest)||!Array.isArray(backup.companies)||backup.companies.length!==8)throw new Error('Missing backup');
 validateFixtureBackup(manifest,backup.companies);
 const mapping=parseSeedMapping(JSON.parse(await readFile('.seatpax/seed-accounts.json','utf8')));
 const target=parseMigrationEnvironment(process.env),connection=createDatabaseConnection(target.url);
 try{
  const result=await applyReviewedFixtureCleanup(mapping.superAdmin,manifest,createFixtureMaintenanceRepository(connection.db.$client));
  const receipt={manifestDigest:manifest.digest,backupDigest:manifest.backupDigest,completedAt:new Date().toISOString(),result,rollbackEligible:manifest.companies.filter(c=>c.status==='ACTIVE').map(c=>({companyId:c.id,expectedStatusRevision:c.statusRevision+1,target:'ACTIVE'}))};
  const file=await open(path.join(directory,`${manifest.digest}.receipt.json`),'w',0o600);
  try{await file.writeFile(JSON.stringify(receipt,null,2)+'\n');await file.sync();}finally{await file.close();}
  console.log(JSON.stringify(receipt));
 }
 finally{await connection.close();}
}
main().catch(()=>{console.error('Fixture outcome unconfirmed. Inspect status/events and reviewed files before retrying the identical manifest and actor.');process.exitCode=1;});
