import Link from 'next/link';
import {CaretRight} from '@phosphor-icons/react/dist/ssr/CaretRight';
import {DomainError} from '@/modules/access/transaction';
import SuperAdminShell from './components/super-admin-shell';
import {StaffDirectory,StaffSummary} from './components/staff-directory';
import {dashboardData} from './dashboard-data';
import './dashboard.css';
export const dynamic='force-dynamic';
export default async function DashboardPage({searchParams}:{searchParams:Promise<{q?:string|string[];status?:string|string[];page?:string|string[]}>}){
 let snapshot;
 try{snapshot=await dashboardData(await searchParams);}catch(error){
  if(!(error instanceof DomainError))throw error;
  return <SuperAdminShell section="dashboard"><h1>Dashboard</h1><p role="alert">{error.code==='forbidden'?'Akses Super Admin ditolak.':'Data petugas belum dapat dimuat. Coba muat ulang.'}</p>{error.code!=='forbidden'&&<Link className="super-dashboard-link" href="/super-admin">Coba lagi<CaretRight size={16} aria-hidden="true"/></Link>}</SuperAdminShell>;
 }
 return <SuperAdminShell section="dashboard">
  <div className="super-page-heading"><h1>Dashboard</h1><p>Petugas dan akses di {snapshot.company.name}.</p></div>
  <StaffSummary snapshot={snapshot}/>
  <div className="super-dashboard-grid"><StaffDirectory snapshot={snapshot}/>
   <aside className="super-company-context" aria-labelledby="company-context-title"><h2 id="company-context-title">Perusahaan</h2><strong>{snapshot.company.name}</strong><p>Status penjualan: {snapshot.company.status==='ACTIVE'?'Aktif':'Disuspend'}</p><Link className="super-dashboard-link" href="/super-admin/companies">Lihat perusahaan<CaretRight size={16} aria-hidden="true"/></Link></aside>
  </div>
 </SuperAdminShell>;
}
