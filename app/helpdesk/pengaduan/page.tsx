import {unstable_rethrow} from 'next/navigation';
import {helpdeskContext} from '../data';
import CaseList from '../components/case-list';
import {normalizeHelpdeskPage} from '@/modules/helpdesk/staff';

export default async function HelpdeskCases({searchParams}:{searchParams:Promise<{search?:string;status?:string;priority?:string;page?:string}>}){
 const query=await searchParams;
 let data:Awaited<ReturnType<Awaited<ReturnType<typeof helpdeskContext>>['staff']['list']>>|undefined;
 let unavailable=false;
 try{const {ctx,staff}=await helpdeskContext();data=await staff.list(ctx,{...query,page:normalizeHelpdeskPage(query.page)});}
 catch(error){unstable_rethrow(error);unavailable=true;}
 if(unavailable||!data)return <section className="hd-panel" role="alert"><h1>Daftar pengaduan belum tersedia</h1><p>Periksa akses dan coba muat ulang halaman.</p></section>;
 return <CaseList data={data} query={query}/>;
}
