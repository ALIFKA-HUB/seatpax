import {config} from 'dotenv';
import {parseMigrationEnvironment} from '../lib/env/migration';
import {createDatabaseConnection} from '../lib/db/connection';
import {helpdeskConfig} from '../lib/env/helpdesk';
import {drainHelpdeskMail} from '../modules/helpdesk/mail-worker';
config({path:'.env.local',quiet:true});
const connection=createDatabaseConnection(parseMigrationEnvironment(process.env).url);
try{console.log(await drainHelpdeskMail(connection.db.$client,helpdeskConfig()));}catch{console.error('Pengiriman notifikasi belum tersedia. Periksa konfigurasi.');process.exitCode=1;}finally{await connection.close();}
