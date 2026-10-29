import {notFound,unstable_rethrow} from 'next/navigation';
import {helpdeskContext} from '@/app/helpdesk/data';
import CaseDetailView from '@/app/helpdesk/components/case-detail-view';
import {requireAccess} from '@/modules/access/server';
import {helpdeskConfig} from '@/lib/env/helpdesk';

export default async function AdminCaseDetail({params}:{params:Promise<{companyId:string;id:string}>}){
 const {companyId,id}=await params;
 let data:Awaited<ReturnType<Awaited<ReturnType<typeof helpdeskContext>>['staff']['detail']>>|undefined;
 let unavailable=false;
 try{const config=helpdeskConfig();if(config.companyId!==companyId)throw new Error('Company mismatch');await requireAccess('tenant.admin',companyId);const {ctx,staff}=await helpdeskContext();data=await staff.detail(ctx,id);}
 catch(error){unstable_rethrow(error);unavailable=true;}
 if(unavailable)return <section className="hd-panel" role="alert"><h1>Akses laporan tidak tersedia</h1><p>Periksa akses Admin perusahaan dan nomor laporan.</p></section>;
 if(!data)notFound();
 return <div className="hd hd-admin-monitor"><CaseDetailView id={id} data={data} readOnly backHref={'/admin/companies/'+companyId+'/helpdesk'}/></div>;
}
