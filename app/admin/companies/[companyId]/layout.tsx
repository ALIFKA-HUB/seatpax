import Link from 'next/link';
import {companyData,adminCompanies} from '../../data';
import '../../admin.css';
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{companyId:string}>}){const {companyId}=await params;await companyData(companyId);const companies=await adminCompanies();const company=companies.find(c=>c.id===companyId);const base=`/admin/companies/${companyId}`;return <div className="admin-shell"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand">SEATPAX<span>ADMIN PO</span></Link><p className="admin-company">{company?.name}</p><nav aria-label="Navigasi admin"><Link href={base+'/trips'}>Perjalanan</Link><Link href={base+'/routes'}>Rute & tarif</Link><Link href={base+'/stops'}>Daftar stop</Link><Link href={base+'/service-classes'}>Kelas layanan</Link><Link href={base+'/seat-templates'}>Template kursi</Link><Link href={base+'/vehicles'}>Armada</Link></nav><Link href="/account" className="admin-account">Akun & keluar</Link></aside><main className="admin-main">{children}</main></div>;}


