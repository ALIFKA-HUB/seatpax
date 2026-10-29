import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import CaseList from '@/app/helpdesk/components/case-list';

it('keeps Admin monitoring links and complete case identifiers in the list',()=>{
 const id='12345678-1234-4234-8234-123456789abc';
 const data={count:25,hasMore:false,rows:Array.from({length:25},(_,index)=>({id:index===0?id:`22345678-1234-4234-8234-${String(index).padStart(12,'0')}`,code:index===0?'SPX-2026-000001':`SPX-2026-${String(index).padStart(6,'0')}`,title:'Pembayaran belum muncul',category:'PAYMENT',status:'MENUNGGU',priority:null,created_at:new Date('2026-10-28T10:00:00Z')}))} as unknown as Parameters<typeof CaseList>[0]['data'];
 const html=renderToStaticMarkup(createElement(CaseList,{
  data,
  query:{status:'MENUNGGU',page:'1'},
  base:'/admin/companies/company-id/helpdesk',
  detailBase:'/admin/companies/company-id/helpdesk',
 }));
 expect(html).toContain('href="/admin/companies/company-id/helpdesk/'+id+'"');
 expect(html).toContain('SPX-2026-000001');
 expect(html).not.toContain('href="/admin/companies/company-id/helpdesk?status=MENUNGGU&amp;page=2"');
 const nextHtml=renderToStaticMarkup(createElement(CaseList,{data:{...data,hasMore:true},query:{status:'MENUNGGU',page:'1'},base:'/admin/companies/company-id/helpdesk',detailBase:'/admin/companies/company-id/helpdesk'}));
 expect(nextHtml).toContain('href="/admin/companies/company-id/helpdesk?status=MENUNGGU&amp;page=2"');
});
