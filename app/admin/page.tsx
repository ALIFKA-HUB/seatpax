import Link from 'next/link';
import {redirect} from 'next/navigation';
import {adminCompanies} from './data';
import Brand from '@/app/components/brand';
import './admin.css';
export const dynamic='force-dynamic';
export default async function AdminPage(){
 const companies=await adminCompanies();if(companies.length===1)redirect(`/admin/companies/${companies[0].id}/routes`);
 return <main className="admin-entry"><Brand href="/admin"/><header className="admin-header"><p>Admin PO</p><h1>Pilih perusahaan</h1></header>{companies.length?<ul>{companies.map(c=><li key={c.id}><Link href={`/admin/companies/${c.id}/routes`}>{c.name}<span aria-hidden="true"> →</span></Link></li>)}</ul>:<p>Akun ini belum memiliki akses admin PO.</p>}<Link href="/account">Kembali ke akun</Link></main>;
}
