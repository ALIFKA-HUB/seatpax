import {config} from 'dotenv';
import {createDatabaseConnection} from '../lib/db/connection';
import {parseMigrationEnvironment} from '../lib/env/migration';
import {prepareFixtureCleanup,writeFixtureBackup} from '../modules/company/fixture-maintenance';
import {createFixtureMaintenanceRepository} from '../modules/company/fixture-maintenance-repository';
config({path:'.env.local',quiet:true});
async function main(){
 if(process.argv.length!==2)throw new Error('Unexpected arguments');
 const target=parseMigrationEnvironment(process.env),connection=createDatabaseConnection(target.url);
 try {
  const manifest=await prepareFixtureCleanup(connection.db.$client);
  const state=await connection.db.$client.begin('isolation level repeatable read read only',tx=>createFixtureMaintenanceRepository(connection.db.$client).inspect(tx));
  if(state.protectedDigest!==manifest.protectedDigest)throw new Error('Preflight changed');
  const files=await writeFixtureBackup(manifest,state.companyRows);
  console.log(JSON.stringify({mode:'prepared-only',projectRef:target.projectRef,digest:manifest.digest,companies:manifest.companies,protectedDigest:manifest.protectedDigest,activeHoldCount:manifest.activeHoldCount,livePaymentHoldCount:manifest.livePaymentHoldCount,counts:state.counts,...files},null,2));
 }finally{await connection.close();}
}
main().catch(()=>{console.error('Fixture preparation stopped. Verify the guarded target, audited identities/counts, live holds, and backup files. No company status was changed.');process.exitCode=1;});
