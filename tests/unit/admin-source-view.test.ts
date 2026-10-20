import {it,expect,vi} from 'vitest';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {formatIdr} from '@/app/presentation';
import ConflictPanel from '@/app/admin/components/conflict-panel';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh(){}})}));
vi.mock('@/app/admin/actions',()=>({runAdminAction:vi.fn()}));
const data={routes:[{id:'route',name:'Rute <panjang>',code:null,status:'ACTIVE'}],stops:[{id:'stop',name:'Stop lama',city:'Kota',address:null,status:'ACTIVE'}],classes:[{id:'class',name:'Kelas lama',code:'kelas',status:'ACTIVE'}]};
vi.mock('@/app/admin/data',()=>({companyData:async()=>({data})}));
it('labels known source states and retains unknown codes',async()=>{
 const {sourceStatusPresentation:label}=await import('@/app/admin/presentation');
 expect(label('MAINTENANCE').label).toBe('Dalam perawatan');expect(label('FUTURE')).toEqual({label:'Status perlu diperiksa: FUTURE',tone:'neutral'});expect(label('toString').tone).toBe('neutral');
 expect(formatIdr('9007199254740993')).toBe('Rp 9.007.199.254.740.993');
});
it('renders named locally scrollable route tables',async()=>{
 const {default:Page}=await import('@/app/admin/companies/[companyId]/routes/page');const html=render(await Page({params:Promise.resolve({companyId:'a'})}));
 for(const s of ['role="region"','aria-label="Daftar rute"','tabindex="0"','Rute &lt;panjang&gt;','/admin/companies/a/routes/route'])expect(html).toContain(s);
});
it('retains existing stop rows with directory creation and distinguishes empty class data',async()=>{
 const {default:Stops}=await import('@/app/admin/companies/[companyId]/stops/page');const html=render(await Stops({params:Promise.resolve({companyId:'a'})}));expect(html).toContain('Stop lama');expect(html).toContain('Tambah titik');
 const {default:Classes}=await import('@/app/admin/companies/[companyId]/service-classes/page');const list=render(await Classes({params:Promise.resolve({companyId:'a'})}));expect(list.indexOf('Kelas lama')).toBeLessThan(list.indexOf('Tambah kelas'));
 data.classes=[];expect(render(await Classes({params:Promise.resolve({companyId:'a'})}))).toContain('Belum ada kelas');
});
it('keeps revision conflict choices explicit',()=>{
 const html=render(h(ConflictPanel,{latest:{name:'Baru'},onRefresh(){},onAdopt(){},onOverwrite(){}}));
 for(const s of ['Muat data terbaru','Gunakan data terbaru','Pertahankan draft untuk mengganti','<details','fleet-conflict'])expect(html).toContain(s);
});
