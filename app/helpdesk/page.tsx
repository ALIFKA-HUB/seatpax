import {unstable_rethrow} from 'next/navigation';
import {helpdeskContext} from './data';
import CaseList from './components/case-list';
export default async function HelpdeskPage({searchParams}:{searchParams:Promise<{search?:string;status?:string;priority?:string;page?:string}>}){const query=await searchParams;let data;try{const {ctx,staff}=await helpdeskContext();data=await staff.list(ctx,{...query,page:Number(query.page)||1});}catch(e){unstable_rethrow(e);}if(!data)return <section className="hd-panel"><h1>Helpdesk belum tersedia</h1><p>Pastikan akun memiliki akses Petugas Helpdesk atau Admin perusahaan dan konfigurasi pengaduan sudah disiapkan.</p></section>;return <CaseList data={data} query={query}/>;}
