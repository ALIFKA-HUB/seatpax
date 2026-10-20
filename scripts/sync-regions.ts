import {config} from 'dotenv';
import {createDatabaseConnection} from '../lib/db/connection';
import {parseMigrationEnvironment} from '../lib/env/migration';
import {createRegionRepository} from '../modules/regions/repository';
import {syncRegions} from '../modules/regions/sync-service';
import {RegionImportError} from '../modules/regions/provider';

config({path: '.env.local', quiet: true});
async function main() {
  const args = process.argv.slice(2);
  const apply = args[0] === '--apply';
  const expectedDigest = args[1] === '--expected-digest' ? args[2] : undefined;
  if (args.length && (!apply || (args.length !== 1 && !(args.length === 3 && expectedDigest && /^[a-f0-9]{64}$/.test(expectedDigest))))) throw new Error('Invalid arguments');
  const target = parseMigrationEnvironment(process.env);
  const connection = createDatabaseConnection(target.url);
  try {console.log(JSON.stringify(await syncRegions({apply, expectedDigest}, createRegionRepository(connection.db.$client), fetch)));}
  finally {await connection.close();}
}
main().catch(error => {console.error(error instanceof RegionImportError ? error.code : 'Region synchronization failed. Check arguments, target and connection.'); process.exitCode = 1;});
