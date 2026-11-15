import {it,expect} from 'vitest';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import SupplementPage from '@/app/pengaduan/lengkapi/page';

it('frames the complaint supplement workspace with return links and tracking navigation',async()=>{
 const html=render(await SupplementPage({searchParams:Promise.resolve({kode:'SPX-2026-0001'})}));
 expect(html).toContain('hd-workspace');
 expect(html).toContain('hd-workspace-heading');
 expect(html).toContain('href="/pengaduan"');
 expect(html).toContain('href="/pengaduan/cek"');
 expect(html).toContain('SPX-2026-0001');
});

it('unifies cross-workspace navigation across account, super-admin, passenger, and admin helpdesk views',()=>{
 const account=readFileSync('app/account/page.tsx','utf8');
 expect(account).toContain('href="/super-admin"');
 expect(account).toContain('href="/super-admin/companies"');

 const companies=readFileSync('app/super-admin/companies/page.tsx','utf8');
 expect(companies).toContain('super-page-heading');
 expect(companies).toContain('Coba lagi');

 const trip=readFileSync('app/trips/[tripId]/page.tsx','utf8');
 expect(trip).toContain('StatePanel');
 expect(trip).toContain('sp-back');
 expect(trip).toContain('sp-page-heading');

 const hold=readFileSync('app/holds/[holdId]/page.tsx','utf8');
 expect(hold).toContain('StatePanel');
 expect(hold).toContain('sp-back');

 const ticket=readFileSync('app/tickets/[ticketId]/page.tsx','utf8');
 expect(ticket).toContain('/pengaduan/buat');

 const adminHelpdesk=readFileSync('app/admin/companies/[companyId]/helpdesk/page.tsx','utf8');
 expect(adminHelpdesk).toContain('hd-panel');
 expect(adminHelpdesk).toContain('helpdesk-staff');

 const adminDetail=readFileSync('app/admin/companies/[companyId]/helpdesk/[id]/page.tsx','utf8');
 expect(adminDetail).toContain('pengaduan.css');
 expect(adminDetail).toContain('helpdesk.css');
 expect(adminDetail).toContain('helpdesk-staff');

 const adminStaff=readFileSync('app/admin/companies/[companyId]/helpdesk-staff/page.tsx','utf8');
 expect(adminStaff).toContain('hd-back-link');
 expect(adminStaff).toContain('hd-staff-table');
});
