import {beforeEach,it,expect,vi} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {DomainError} from '@/modules/access/transaction';
import type {StaffDirectorySnapshot} from '@/modules/staff-directory/types';
const f=vi.hoisted(()=>({data:vi.fn()}));
vi.mock('next/font/google',()=>({Inter:()=>({variable:'font-internal-inter'})}));
vi.mock('@/app/super-admin/dashboard-data',()=>({dashboardData:f.data}));
const snapshot:StaffDirectorySnapshot={company:{id:'company',name:'Perusahaan nyata',status:'ACTIVE'},counts:{total:27,active:26,disabled:1},query:{q:'nama & email',status:'disabled',page:2},page:2,pageSize:25,totalPages:2,filteredTotal:27,rows:[{id:'person',name:'Nama <aman>',email:null,status:'ACTIVE',roles:[{role:'CREW',status:'ACTIVE'},{role:'HELPDESK',status:'DISABLED'}]}]};
beforeEach(()=>f.data.mockReset().mockResolvedValue(snapshot));
it('renders real summary filters, escaped profiles and per-role legacy statuses without fictitious management controls',async()=>{
 const {default:Page}=await import('@/app/super-admin/page');
 const html=render(await Page({searchParams:Promise.resolve({})}));
 for(const value of ['Dashboard','Petugas terdaftar','Akses aktif','Akses nonaktif','27','Nama &lt;aman&gt;','Email belum tersedia','Helpdesk','Nonaktif','method="get"','name="q"','maxLength="80"','id="petugas"','Perusahaan nyata']){
  expect(html).toContain(value);
 }
 for(const value of ['Tambah petugas','Kelola user','Aktivitas terbaru','aditya@example.com','data-explain='])expect(html).not.toContain(value);
 expect(html).toContain('q=nama+%26+email');expect(html).toContain('aria-current="page"');
});
it('preserves filters on page links and distinguishes real empty from filtered empty',async()=>{
 const {StaffDirectory}=await import('@/app/super-admin/components/staff-directory');
 const html=render(h(StaffDirectory,{snapshot}));
 expect(html).toContain('status=disabled');expect(html).toContain('Sebelumnya');expect(html).toContain('aria-disabled="true"');
 expect(render(h(StaffDirectory,{snapshot:{...snapshot,counts:{total:0,active:0,disabled:0},rows:[],filteredTotal:0,page:1,totalPages:1}}))).toContain('Belum ada petugas');
 expect(render(h(StaffDirectory,{snapshot:{...snapshot,rows:[],filteredTotal:0,page:1,totalPages:1}}))).toContain('Tidak ada petugas yang sesuai');
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
