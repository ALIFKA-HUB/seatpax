import Link from 'next/link';
import {notFound,unstable_rethrow} from 'next/navigation';
import {helpdeskContext} from '@/app/helpdesk/data';
import CaseDetailView from '@/app/helpdesk/components/case-detail-view';
import {requireAccess} from '@/modules/access/server';
import {helpdeskConfig} from '@/lib/env/helpdesk';
import '@/app/pengaduan/pengaduan.css';
import '@/app/helpdesk/helpdesk.css';

export default async function AdminCaseDetail({params}:{params:Promise<{companyId:string;id:string}>}){
 const {companyId,id}=await params;
 let data:Awaited<ReturnType<Awaited<ReturnType<typeof helpdeskContext>>['staff']['detail']>>|undefined;
 let unavailable=false;
 try{const config=helpdeskConfig();if(config.companyId!==companyId)throw new Error('Company mismatch');await requireAccess('tenant.admin',companyId);const {ctx,staff}=await helpdeskContext();data=await staff.detail(ctx,id);}
 catch(error){unstable_rethrow(error);unavailable=true;}
 if(unavailable)return <div className="hd hd-admin-monitor"><section className="hd-panel" role="alert"><h1>Akses laporan tidak tersedia</h1><p>Periksa akses Admin perusahaan dan nomor laporan.</p><Link className="hd-secondary" href={'/admin/companies/'+companyId+'/helpdesk'}>← Kembali ke pengaduan</Link></section></div>;
 if(!data)notFound();
 return <div className="hd hd-admin-monitor"><div className="hd-row"><span className="hd-kicker">Mode pemantauan Admin PO</span><Link className="hd-secondary" href={'/admin/companies/'+companyId+'/helpdesk-staff'}>Kelola petugas Helpdesk →</Link></div><CaseDetailView id={id} data={data} readOnly backHref={'/admin/companies/'+companyId+'/helpdesk'}/></div>;
}
