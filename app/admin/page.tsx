import Link from 'next/link';
import {redirect} from 'next/navigation';
import {adminCompanies} from './data';
export const dynamic='force-dynamic';
export default async function AdminPage(){const companies=await adminCompanies();if(companies.length===1)redirect(`/admin/companies/${companies[0].id}/routes`);return <main className="setup"><p className="eyebrow">SEATPAX / ADMIN PO</p><h1>Pilih perusahaan</h1>{companies.length?companies.map(c=><p key={c.id}><Link href={`/admin/companies/${c.id}/routes`}>{c.name}</Link></p>):<p>Akun ini belum memiliki akses admin PO.</p>}<Link href="/account">Kembali ke akun</Link></main>;}
