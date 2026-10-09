import {companyData,adminCompanies} from '../../data';
import AdminShell from '../../components/admin-shell';
import '../../admin.css';
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{companyId:string}>}) {
 const {companyId}=await params;await companyData(companyId);const companies=await adminCompanies();const company=companies.find(c=>c.id===companyId);
 return <AdminShell companyId={companyId} companyName={company?.name??'Perusahaan PO'}>{children}</AdminShell>;
}
