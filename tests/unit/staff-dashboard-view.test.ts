import {beforeEach,it,expect,vi} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {DomainError} from '@/modules/access/transaction';
import type {StaffDirectorySnapshot} from '@/modules/staff-directory/types';

const f=vi.hoisted(()=>({
 data:vi.fn(),
 revalidatePath:vi.fn(),
 getVerifiedUser:vi.fn(),
 createClient:vi.fn(),
 createUser:vi.fn(),
 sql:Object.assign(vi.fn(),{begin:vi.fn()}),
}));

vi.mock('next/font/google',()=>({Inter:()=>({variable:'font-internal-inter'})}));
vi.mock('next/cache',()=>({revalidatePath:f.revalidatePath}));
vi.mock('@/app/super-admin/dashboard-data',()=>({dashboardData:f.data}));
vi.mock('@/modules/auth/identity',()=>({getVerifiedUser:f.getVerifiedUser}));
vi.mock('@supabase/supabase-js',()=>({createClient:f.createClient}));
vi.mock('@/lib/db',()=>({getDatabase:()=>({$client:f.sql})}));

const snapshot:StaffDirectorySnapshot={company:{id:'company',name:'Perusahaan nyata',status:'ACTIVE'},counts:{total:27,active:26,disabled:1},query:{q:'nama & email',status:'disabled',page:2},page:2,pageSize:25,totalPages:2,filteredTotal:27,rows:[{id:'person',name:'Nama <aman>',email:null,status:'ACTIVE',roles:[{role:'CREW',status:'ACTIVE'},{role:'HELPDESK',status:'DISABLED'}]}]};

beforeEach(()=>{
 vi.resetAllMocks();
 vi.stubEnv('NODE_ENV','development');
 f.data.mockResolvedValue(snapshot);
 f.createClient.mockReturnValue({auth:{admin:{createUser:f.createUser}}});
 f.sql.begin.mockImplementation(async(fn:(tx:unknown)=>unknown)=>fn(f.sql));
});

it('renders real summary filters, escaped profiles, add-staff form and inline access controls',async()=>{
 const {default:Page}=await import('@/app/super-admin/page');
 const html=render(await Page({searchParams:Promise.resolve({})}));
 for(const value of [
  'Dashboard','Petugas terdaftar','Akses aktif','Akses nonaktif','27','Nama &lt;aman&gt;','Email belum tersedia','Helpdesk','Nonaktif',
  'method="get"','name="q"','maxLength="80"','id="petugas"','Perusahaan nyata',
  'Tambah petugas','id="tambah-petugas"','name="name"','name="email"','name="role"','name="userId"',
  'Simpan role','Nonaktifkan','Kelola akses'
 ]){
  expect(html).toContain(value);
 }
 for(const value of ['Kelola user','Aktivitas terbaru','aditya@example.com','data-explain='])expect(html).not.toContain(value);
 expect(html).toContain('q=nama+%26+email');expect(html).toContain('aria-current="page"');
});

it('preserves filters on page links, distinguishes empty states and defaults role selection',async()=>{
 const {StaffDirectory}=await import('@/app/super-admin/components/staff-directory');
 const html=render(h(StaffDirectory,{snapshot}));
 expect(html).toContain('status=disabled');expect(html).toContain('Sebelumnya');expect(html).toContain('aria-disabled="true"');
 expect(html).toMatch(/<option[^>]*value="CREW"[^>]*selected/);
 expect(render(h(StaffDirectory,{snapshot:{...snapshot,counts:{total:0,active:0,disabled:0},rows:[],filteredTotal:0,page:1,totalPages:1}}))).toContain('Belum ada petugas');
 expect(render(h(StaffDirectory,{snapshot:{...snapshot,rows:[],filteredTotal:0,page:1,totalPages:1}}))).toContain('Tidak ada petugas yang sesuai');
 const disabledHtml=render(h(StaffDirectory,{snapshot:{...snapshot,rows:[{id:'p2',name:'Staff Nonaktif',email:'staff@example.com',status:'DISABLED',roles:[{role:'HELPDESK',status:'DISABLED'}]}]}}));
 expect(disabledHtml).toContain('Aktifkan');
 expect(disabledHtml).toMatch(/<option[^>]*value="HELPDESK"[^>]*selected/);
});

it('returns denied and unavailable views without exposing any profiles or secret error text',async()=>{
 const {default:Page}=await import('@/app/super-admin/page');
 for(const code of ['forbidden','unavailable'] as const){
  f.data.mockRejectedValueOnce(new DomainError(code,'private SQL value'));
  const html=render(await Page({searchParams:Promise.resolve({})}));
  expect(html).toContain('role="alert"');expect(html).toContain(code==='forbidden'?'Akses Super Admin ditolak.':'Data petugas belum dapat dimuat.');
  for(const secret of ['Nama &lt;aman&gt;','private SQL value','Petugas terdaftar'])expect(html).not.toContain(secret);
 }
});

it('marks only the current shell section active and keeps both existing destinations',async()=>{
 const {default:Shell}=await import('@/app/super-admin/components/super-admin-shell');
 const html=render(h(Shell,{section:'dashboard',children:h('h1',null,'Dashboard')}));
 const active=[...html.matchAll(/<a\b[^>]*>/g)].map(m=>m[0]).filter(link=>link.includes('aria-current="page"'));
 expect(active).toHaveLength(1);expect(active[0]).toContain('href="/super-admin"');expect(html).toContain('href="/super-admin/companies"');
});

it('executes createStaffFormAction and updateStaffFormAction with revalidation',async()=>{
 const {createStaffFormAction,updateStaffFormAction,ensureSupabaseAuthUser}=await import('@/app/super-admin/staff-actions');
 f.getVerifiedUser.mockResolvedValue({id:'b361cb67-452f-4ef4-96b0-80a75d58cff5'});
 f.sql.mockImplementation(async(strings:TemplateStringsArray)=>{
  const query=strings.join('?');
  if(query.includes('memberships')&&query.includes('SUPER_ADMIN'))return [{id:'super-mem'}];
  if(query.includes('auth.users'))return [];
  if(query.includes('public.companies'))return [{id:'00000000-0000-4000-8000-000000000001'}];
  if(query.includes('public.users'))return [{id:'00000000-0000-4000-8000-000000000099'}];
  return [];
 });
 f.createUser.mockResolvedValue({data:{user:{id:'00000000-0000-4000-8000-000000000099'}},error:null});

 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://project.supabase.co');
 vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','service-key');

 const createdId=await ensureSupabaseAuthUser('test@seatpax.com','Petugas Baru');
 expect(createdId).toBe('00000000-0000-4000-8000-000000000099');

 const addData=new FormData();
 addData.set('name','Petugas Baru');
 addData.set('email','test@seatpax.com');
 addData.set('role','CREW');
 await createStaffFormAction(addData);
 expect(f.revalidatePath).toHaveBeenCalledWith('/super-admin');

 const updateData=new FormData();
 updateData.set('userId','00000000-0000-4000-8000-000000000099');
 updateData.set('role','ADMIN_PO');
 updateData.set('status','ACTIVE');
 await updateStaffFormAction(updateData);
 expect(f.revalidatePath).toHaveBeenCalledTimes(2);
});
