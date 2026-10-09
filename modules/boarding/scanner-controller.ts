import {parseTicketToken} from './validation';
export type LocalScanner={start:()=>Promise<void>;stop:()=>void;destroy:()=>void};
export function createScannerController<T>(deps:{factory:(onDecoded:(token:string)=>void)=>Promise<LocalScanner>;resolve:(token:string)=>Promise<T>;onResult:(value:T)=>void;onError:(message:string)=>void;onRunning:(running:boolean)=>void}){
 let scanner:LocalScanner|null=null,closed=false,pending=false,settled=false;
 function destroy(){scanner?.stop();scanner?.destroy();}
 async function decoded(raw:string){if(closed||settled)return;settled=true;destroy();deps.onRunning(false);
  try{const token=parseTicketToken(raw),result=await deps.resolve(token);if(!closed)deps.onResult(result);}catch{if(!closed)deps.onError('Tiket tidak dapat dibuka. Coba scan ulang atau cari di manifest.');}
 }
 return {
  async start(){if(closed||pending||scanner)return;pending=true;try{
   const created=await deps.factory(token=>{void decoded(token);});scanner=created;
   if(closed){destroy();return;}await created.start();if(closed||settled)destroy();else deps.onRunning(true);
  }catch{destroy();settled=true;if(!closed){deps.onRunning(false);deps.onError('Kamera tidak tersedia atau izin ditolak. Gunakan manifest untuk mencari penumpang.');}}finally{pending=false;}},
  close(){closed=true;destroy();},
 };
}
