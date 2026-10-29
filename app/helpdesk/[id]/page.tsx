import {notFound,unstable_rethrow} from 'next/navigation';
import {helpdeskContext} from '../data';
import CaseDetailView from '../components/case-detail-view';

export default async function CaseDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 let data:Awaited<ReturnType<Awaited<ReturnType<typeof helpdeskContext>>['staff']['detail']>>|undefined;
 let unavailable=false;
 try{const {ctx,staff}=await helpdeskContext();data=await staff.detail(ctx,id);}
 catch(error){unstable_rethrow(error);unavailable=true;}
 if(unavailable)return <section className="hd-panel" role="alert"><h1>Akses laporan tidak tersedia</h1><p>Periksa akses petugas dan nomor laporan.</p></section>;
 if(!data)notFound();
 return <CaseDetailView id={id} data={data}/>;
}
