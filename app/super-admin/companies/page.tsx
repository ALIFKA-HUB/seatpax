import Link from 'next/link';
import SuperAdminShell from '../components/super-admin-shell';
import {DomainError} from '@/modules/access/transaction';
import {companyData} from '../data';
import {CompanyList} from '../components/company-list';
import '../dashboard.css';
export const dynamic='force-dynamic';
export default async function CompaniesPage(){let companies;
 try{companies=await companyData();}catch(error){if(!(error instanceof DomainError))throw error;return <SuperAdminShell><div className="super-page-heading"><h1>Super Admin</h1><p>Status layanan dan aktivasi perusahaan PO.</p></div><p role="alert">{error.code==='forbidden'?'Akses Super Admin ditolak.':'Daftar PO belum dapat dimuat. Coba muat ulang.'}</p>{error.code!=='forbidden'&&<Link className="super-dashboard-link" href="/super-admin/companies">Coba lagi</Link>}</SuperAdminShell>;}
 return <SuperAdminShell><div className="super-page-heading"><h1>Perusahaan PO</h1><p>Kelola status penjualan PO.</p></div><CompanyList companies={companies} /></SuperAdminShell>;
}
