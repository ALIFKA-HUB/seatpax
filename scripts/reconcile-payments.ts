import {config} from 'dotenv';
import {parseMigrationEnvironment} from '../lib/env/migration';
import {parsePaymentEnv} from '../lib/env/payment';
import {createDatabaseConnection} from '../lib/db/connection';
import {createPaymentRepository} from '../modules/payment/repository';
import {createMidtransProvider} from '../modules/payment/midtrans-provider';
import {createPaymentEventService} from '../modules/payment/event-service';
import {createConfirmationService} from '../modules/payment/confirmation-service';
config({path:'.env.local',quiet:true});
const args=process.argv.slice(2),value=args.find(a=>a.startsWith('--limit='))?.slice('--limit='.length)??(args.includes('--limit')?args[args.indexOf('--limit')+1]:undefined),limit=value===undefined?100:Number(value);
if(!Number.isInteger(limit)||limit<1||limit>100){console.error('Limit must be between 1 and 100.');process.exitCode=1;}else try{const env=parsePaymentEnv(process.env),migration=parseMigrationEnvironment(process.env),connection=createDatabaseConnection(migration.url);try{const repo=createPaymentRepository(connection.db.$client),events=createPaymentEventService(repo,createMidtransProvider(env),createConfirmationService(repo,env));console.log(await events.reconcilePayments(limit));}finally{await connection.close();}}catch{console.error('Payment reconciliation failed. Check local database and Sandbox configuration.');process.exitCode=1;}
