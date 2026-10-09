import {it,expect,vi} from 'vitest';import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import type {TemplateDetail,VehicleDetail} from '@/modules/fleet/types';
import Builder from '@/app/admin/components/seat-template-builder';import SeatGrid from '@/app/admin/components/seat-grid';import VehicleForm from '@/app/admin/components/vehicle-form';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh(){},push(){}})}));vi.mock('@/app/admin/fleet-actions',()=>({runFleetAction:vi.fn()}));
const template:TemplateDetail={id:'t',name:'Denah A',version:2,status:'ACTIVE',capacity:1,rows:2,cols:3,cells:[{rowIndex:0,colIndex:0,type:'SEAT',seatCode:'01',label:null},{rowIndex:0,colIndex:1,type:'DRIVER',seatCode:null,label:null},{rowIndex:0,colIndex:2,type:'AISLE',seatCode:null,label:null},{rowIndex:1,colIndex:0,type:'DOOR',seatCode:null,label:null},{rowIndex:1,colIndex:1,type:'FACILITY',seatCode:null,label:null},{rowIndex:1,colIndex:2,type:'EMPTY',seatCode:null,label:null}]};
it('renders Indonesian cell labels with original enum values',()=>{const html=render(h(Builder,{companyId:'a',initial:template}));expect(html).toContain('value="SEAT"');expect(html).toMatch(/value="SEAT"[^>]*>Kursi/);expect(html).toContain('Sel baris 1, kolom 1');expect(html).toContain('01');});
it('separates primary save from archive and renumber',()=>{const html=render(h(Builder,{companyId:'a',initial:template}));expect(html).toMatch(/class="admin-primary"[^>]*>Simpan template/);expect(html).toMatch(/class="admin-danger"[^>]*>Arsipkan template/);expect(html).toContain('Nomori ulang kursi');expect(html).toContain('Aktif');});
it('shows fleet status and immutable snapshot controls',()=>{
 const editable=render(h(SeatGrid,{layout:template,selected:'0:0',onSelect(){}}));expect(editable).toContain('aria-pressed="true"');
 const readonly=render(h(SeatGrid,{layout:template}));expect(readonly).toContain('disabled');expect(readonly).not.toContain('aria-pressed');
 const initial:VehicleDetail={id:'v',revision:1,name:'Bus',plateNumber:'B 1 AA',fleetNumber:null,seatTemplateId:'t',defaultServiceClassId:'c',status:'ACTIVE',capacity:1,templateStatus:'ARCHIVED',classStatus:'INACTIVE'};
 const form=render(h(VehicleForm,{companyId:'a',initial,templates:[{...template,status:'ARCHIVED'}],classes:[{id:'c',name:'Kelas lama',status:'INACTIVE'}]}));expect(form).toContain('Denah A');expect(form).toContain('Kelas lama');expect(form).toMatch(/value="MAINTENANCE"[^>]*>Dalam perawatan/);
});
