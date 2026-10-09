import SuperAdminShell from '../components/super-admin-shell';
import {DomainError} from '@/modules/access/transaction';
import {companyData} from '../data';
import {CompanyList} from '../components/company-list';
export const dynamic='force-dynamic';
export default async function CompaniesPage(){let companies;
 try{companies=await companyData();}catch(error){if(!(error instanceof DomainError))throw error;return <SuperAdminShell><h1>Super Admin</h1><p role="alert">{error.code==='forbidden'?'Akses Super Admin ditolak.':'Daftar PO belum dapat dimuat. Coba muat ulang.'}</p></SuperAdminShell>;}
 return <SuperAdminShell><h1>Perusahaan PO</h1><p>Kelola status penjualan PO.</p><CompanyList companies={companies} /></SuperAdminShell>;
}
