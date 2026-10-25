import {helpdeskConfig} from '@/lib/env/helpdesk';
import {requireAccess} from '@/modules/access/server';
import {withAdminTransaction} from '@/modules/access/transaction';
import {getDatabase} from '@/lib/db';
import HelpdeskStaffForm from '@/app/admin/components/helpdesk-staff-form';
import '@/app/pengaduan/pengaduan.css';
export default async function StaffPage({params}:{params:Promise<{companyId:string}>}){const {companyId}=await params;let staff;try{const config=helpdeskConfig();if(config.companyId!==companyId)throw new Error();const actor=await requireAccess('tenant.admin',companyId);staff=await withAdminTransaction(getDatabase().$client,{actorId:actor.userId,companyId},async tx=>tx`select u.email,m.status from public.memberships m join public.users u on u.id=m.user_id where m.company_id=${companyId} and m.role::text='HELPDESK' order by u.email`);}catch{}if(!staff)return <p>Pengelolaan petugas belum tersedia untuk perusahaan ini.</p>;return <div className="hd"><header className="hd-heading"><h1>Petugas Helpdesk</h1><p>Aktifkan atau nonaktifkan akses penanganan pengaduan.</p></header><HelpdeskStaffForm/><section className="hd-panel"><h2>Daftar petugas</h2>{staff.length?staff.map(s=><p key={String(s.email)}>{String(s.email)} · {s.status==='ACTIVE'?'Aktif':'Nonaktif'}</p>):<p>Belum ada petugas Helpdesk.</p>}</section></div>;}
