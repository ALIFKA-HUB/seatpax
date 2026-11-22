import {it,expect,vi} from 'vitest';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {formatIdr} from '@/app/presentation';
import ConflictPanel from '@/app/admin/components/conflict-panel';
import Stops from '@/app/admin/companies/[companyId]/stops/page';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh(){}})}));
vi.mock('@/app/admin/actions',()=>({runAdminAction:vi.fn()}));
// Region catalogue reads are server dependencies, not part of this view test.
vi.mock('@/lib/db',()=>({getDatabase:()=>({$client:{}})}));
vi.mock('@/modules/regions/repository',async()=>{
 const {emptyRegionOptions}=await import('@/modules/regions/types');
 return {createRegionRepository:()=>({readOptions:async()=>emptyRegionOptions})};
});
const data={routes:[{id:'route',name:'Rute <panjang>',code:null,status:'ACTIVE'}],stops:[{id:'stop',name:'Stop lama',city:'Kota',address:null,status:'ACTIVE'}],classes:[{id:'class',name:'Kelas lama',code:'kelas',status:'ACTIVE'}]};
vi.mock('@/app/admin/data',()=>({companyData:async()=>({data})}));
it('labels known source states and retains unknown codes',async()=>{
 const {sourceStatusPresentation:label}=await import('@/app/admin/presentation');
 expect(label('MAINTENANCE').label).toBe('Dalam perawatan');expect(label('FUTURE')).toEqual({label:'Status perlu diperiksa: FUTURE',tone:'neutral'});expect(label('toString').tone).toBe('neutral');
 expect(formatIdr('9007199254740993')).toBe('Rp 9.007.199.254.740.993');
});
it('renders named locally scrollable route tables and routes creation to dedicated new page',async()=>{
 const {default:Page}=await import('@/app/admin/companies/[companyId]/routes/page');const html=render(await Page({params:Promise.resolve({companyId:'a'})}));
 for(const s of ['role="region"','aria-label="Daftar rute"','tabindex="0"','Rute &lt;panjang&gt;','/admin/companies/a/routes/route','/admin/companies/a/routes/new'])expect(html).toContain(s);
 expect(html).not.toContain('Rute baru');
 const {default:NewRoute}=await import('@/app/admin/companies/[companyId]/routes/new/page');
 expect(render(await NewRoute({params:Promise.resolve({companyId:'a'})}))).toContain('Rute baru');
});
it('retains existing stop rows with directory creation and separates service class table from /new',async()=>{
 const html=render(await Stops({params:Promise.resolve({companyId:'a'})}));expect(html).toContain('Stop lama');expect(html).toContain('Tambah titik');
 const {default:Classes}=await import('@/app/admin/companies/[companyId]/service-classes/page');const list=render(await Classes({params:Promise.resolve({companyId:'a'})}));
 for(const s of ['Daftar kelas layanan','Kelas lama','/admin/companies/a/service-classes/class','/admin/companies/a/service-classes/new'])expect(list).toContain(s);
 expect(list).not.toContain('Tambah kelas');
 const {default:NewClass}=await import('@/app/admin/companies/[companyId]/service-classes/new/page');
 expect(render(await NewClass({params:Promise.resolve({companyId:'a'})}))).toContain('Tambah kelas');
 data.classes=[];expect(render(await Classes({params:Promise.resolve({companyId:'a'})}))).toContain('Belum ada kelas');
});
it('keeps revision conflict choices explicit',()=>{
 const html=render(h(ConflictPanel,{latest:{name:'Baru'},onRefresh(){},onAdopt(){},onOverwrite(){}}));
 for(const s of ['Muat data terbaru','Gunakan data terbaru','Pertahankan draft untuk mengganti','<details','fleet-conflict'])expect(html).toContain(s);
});
it('shows hard delete only when route, stop, or class has zero relations',async()=>{
 const {default:RouteEditor}=await import('@/app/admin/components/route-editor');
 const {default:MasterForm}=await import('@/app/admin/components/master-form');
 expect(render(h(RouteEditor,{companyId:'a',choices:[],route:{id:'r',name:'Rute',code:null,status:'ACTIVE',revision:1,canDelete:true}}))).toContain('Hapus permanen');
 const linkedR=render(h(RouteEditor,{companyId:'a',choices:[],route:{id:'r',name:'Rute',code:null,status:'ACTIVE',revision:1,canDelete:false}}));
 expect(linkedR).not.toContain('Hapus permanen');expect(linkedR).toContain('Nonaktifkan rute');
 expect(render(h(MasterForm,{companyId:'a',kind:'class',initial:{id:'c',name:'Kelas',code:'kelas',status:'ACTIVE',canDelete:true}}))).toContain('Hapus permanen');
 expect(render(h(MasterForm,{companyId:'a',kind:'class',initial:{id:'c',name:'Kelas',code:'kelas',status:'ACTIVE',canDelete:false}}))).not.toContain('Hapus permanen');
 expect(render(h(MasterForm,{companyId:'a',kind:'stop',initial:{id:'s',name:'Stop',status:'ACTIVE',canDelete:true}}))).toContain('Hapus permanen');
 expect(render(h(MasterForm,{companyId:'a',kind:'stop',initial:{id:'s',name:'Stop',status:'ACTIVE',canDelete:false}}))).not.toContain('Hapus permanen');
});
