import {it,expect,vi} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
vi.mock('next/navigation',()=>({usePathname:()=>'/admin/companies/a/trips/t/manifest',redirect:(url:string)=>{throw Error(url);}}));
const companies=vi.fn(async()=>[{id:'a',name:'PO <A>'}]);
vi.mock('@/app/admin/data',()=>({adminCompanies:companies}));
it('renders company context brand skip target and account',async()=>{
 const {default:Shell}=await import('@/app/admin/components/admin-shell');
 const html=render(h(Shell,{companyId:'a',companyName:'PO <A>',children:'Isi'}));
 for(const text of ['href="/admin"','PO &lt;A&gt;','href="#admin-main"','id="admin-main"','href="/account"','Isi','aria-current="page"'])expect(html).toContain(text);
 for(const section of ['trips','routes','stops','service-classes','seat-templates','vehicles','payment-conflicts'])expect(html).toContain(`/admin/companies/a/${section}`);
});
it('matches nested sections without prefix collision',async()=>{
 const {isAdminSectionActive:active}=await import('@/app/admin/components/admin-navigation');
 expect(active('/admin/companies/a/trips/t/manifest','/admin/companies/a/trips')).toBe(true);
 expect(active('/admin/companies/a/trips-old','/admin/companies/a/trips')).toBe(false);
 expect(active('/admin/companies/b/trips','/admin/companies/a/trips')).toBe(false);
});
it('preserves single-company redirect and multi-company links',async()=>{
 const {default:Page}=await import('@/app/admin/page');
 await expect(Page()).rejects.toThrow('/admin/companies/a/routes');
 companies.mockResolvedValueOnce([{id:'a',name:'PO <A>'},{id:'b',name:'PO B'}]);
 const html=render(await Page());expect(html).toContain('admin-entry');expect(html).toContain('/admin/companies/b/routes');
 companies.mockResolvedValueOnce([]);expect(render(await Page())).toContain('belum memiliki akses');
});
