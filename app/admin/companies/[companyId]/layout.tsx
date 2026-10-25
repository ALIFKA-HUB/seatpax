import {getDatabase} from '@/lib/db';
import {getVerifiedUser} from '@/modules/auth/identity';
import {companyData,adminCompanies} from '../../data';
import AdminShell from '../../components/admin-shell';
import '../../admin.css';
import '../../admin-refresh.css';
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{companyId:string}>}) {
 const {companyId}=await params;await companyData(companyId);const companies=await adminCompanies();const company=companies.find(c=>c.id===companyId);
 let complaintCount:number|undefined;try{const user=await getVerifiedUser();if(user){const [r]=await getDatabase().$client`select count(*)::int as count from public.helpdesk_cases c where c.company_id=${companyId} and c.status<>'SELESAI' and exists(select 1 from public.memberships m where m.user_id=${user.id} and m.company_id=${companyId} and m.role='ADMIN_PO' and m.status='ACTIVE')`;complaintCount=Number(r.count);}}catch{}
 return <AdminShell complaintCount={complaintCount} companyId={companyId} companyName={company?.name??'Perusahaan PO'}>{children}</AdminShell>;
}
