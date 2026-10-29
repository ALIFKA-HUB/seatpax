import {helpdeskContext} from '@/app/helpdesk/data';
import CaseList from '@/app/helpdesk/components/case-list';
import Link from 'next/link';
import '@/app/pengaduan/pengaduan.css';
import '@/app/helpdesk/helpdesk.css';
import {normalizeHelpdeskPage} from '@/modules/helpdesk/staff';
export default async function AdminComplaints({params,searchParams}:{params:Promise<{companyId:string}>;searchParams:Promise<{search?:string;status?:string;priority?:string;page?:string}>}){const {companyId}=await params;const query=await searchParams;let data;try{const {ctx,staff}=await helpdeskContext();if(ctx.companyId!==companyId)throw new Error();data=await staff.list(ctx,{...query,page:normalizeHelpdeskPage(query.page)});}catch{}if(!data)return <p>Pengaduan belum dikonfigurasi untuk perusahaan ini.</p>;return <div className="hd hd-admin-monitor"><Link href={'/admin/companies/'+companyId+'/helpdesk-staff'}>Kelola petugas Helpdesk</Link><CaseList data={data} query={query} base={'/admin/companies/'+companyId+'/helpdesk'} detailBase={'/admin/companies/'+companyId+'/helpdesk'}/></div>;}
