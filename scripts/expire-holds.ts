import {config} from 'dotenv';
import {parseMigrationEnvironment} from '../lib/env/migration';
import {createDatabaseConnection} from '../lib/db/connection';
import {createInventoryRepository} from '../modules/inventory/repository';
import {createCleanupService} from '../modules/inventory/cleanup-service';
config({path:'.env.local',quiet:true});
try{const env=parseMigrationEnvironment(process.env),connection=createDatabaseConnection(env.url);try{const result=await createCleanupService(createInventoryRepository(connection.db.$client)).expireBatch();console.log(result);if(result.failed)process.exitCode=1;}finally{await connection.close();}}catch{console.error('Expiry maintenance failed. Check development database configuration.');process.exitCode=1;}
