import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CompanyStatusControl} from '@/app/super-admin/components/company-status-control';
import {applyCompanyResult,createCompanyController,reconcileCompanyRows} from '@/app/super-admin/company-ui-state';
const a={id:'00000000-0000-4000-8000-000000000001',name:'PO A',slug:'po-a',status:'ACTIVE' as const,statusRevision:0,updatedAt:'2026-10-09'};
it('renders named confirmation, consequences and pending controls',()=>{
 const props={company:a,confirming:true,pending:true,message:'',onRequest:()=>{},onCancel:()=>{},onConfirm:()=>{}};
 const html=renderToStaticMarkup(createElement(CompanyStatusControl,props));expect(html).toContain('PO A');expect(html).toContain('penjualan baru');expect(html.toLowerCase()).toContain('tiket');expect(html).toContain('disabled');expect(html).toContain('aria-live');
 expect(renderToStaticMarkup(createElement(CompanyStatusControl,{...props,confirming:false,pending:false}))).toContain('Suspend');
 expect(renderToStaticMarkup(createElement(CompanyStatusControl,{...props,company:{...a,status:'SUSPENDED'},confirming:false,pending:false}))).toContain('Aktifkan');
 expect(renderToStaticMarkup(createElement(CompanyStatusControl,{...props,pending:false}))).toContain('autofocus');
});
it('updates only matching ID and ignores older revisions',()=>{
 const b={...a,id:'00000000-0000-4000-8000-000000000002',name:'PO B'};
 const updated={...a,status:'SUSPENDED' as const,statusRevision:1};const rows=applyCompanyResult([a,b],updated);expect(rows).toEqual([updated,b]);expect(applyCompanyResult(rows,a)).toEqual(rows);
});
it('reconciles refreshed props and protects a newer successful response',()=>{
 const newer={...a,status:'SUSPENDED' as const,statusRevision:2};expect(reconcileCompanyRows([newer],[a])).toEqual([newer]);expect(reconcileCompanyRows([a],[newer])).toEqual([newer]);expect(reconcileCompanyRows([], [a])).toEqual([]);
});
it('requires explicit confirm, cancel does nothing and pending deduplicates submission',async()=>{
 let calls=0,release!:(v:{ok:true;result:{company:typeof a;changed:boolean}})=>void;
 const controller=createCompanyController(async()=>{calls++;return new Promise(r=>{release=r;});},()=>{});
 controller.request(a);controller.cancel();expect(calls).toBe(0);expect(controller.state().confirming).toBeNull();
 expect(await controller.confirm()).toBeNull();controller.request(a);const pending=controller.confirm();expect(controller.state().pending).toBe(true);expect(await controller.confirm()).toBeNull();controller.cancel();expect(controller.state().confirming?.id).toBe(a.id);
 release({ok:true,result:{company:{...a,statusRevision:1},changed:true}});expect(await pending).toMatchObject({company:{id:a.id,statusRevision:1}});expect(calls).toBe(1);expect(controller.state().confirming).toBeNull();
});
it('conflict requires refresh and a fresh decision; network failure never updates rows',async()=>{
 let refreshed=0;const controller=createCompanyController(async()=>({ok:false,code:'conflict',message:'Muat ulang'}),()=>{refreshed++;});controller.request(a);expect(await controller.confirm()).toBeNull();expect(refreshed).toBe(1);expect(controller.state().confirming).toBeNull();expect(await controller.confirm()).toBeNull();
 const failed=createCompanyController(async()=>{throw Error('SECRET');},()=>{});failed.request(a);expect(await failed.confirm()).toBeNull();expect(failed.state().message).not.toContain('SECRET');expect(failed.state().pending).toBe(false);
});
