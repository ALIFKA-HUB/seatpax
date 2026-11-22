'use client';
import {useId,useState,useRef} from 'react';
import {useRouter} from 'next/navigation';
import {runAdminAction} from '../actions';
import RegionFields from './region-fields';
import AdminSelect from './admin-select';
import {queueAdminToast} from '../admin-toast';
import {emptyRegionOptions,type RegionOptions} from '@/modules/regions/types';
import type {MasterRow} from '@/modules/route/repository';
export default function MasterForm({companyId,kind,initial,regionOptions=emptyRegionOptions,onSaved,onDeleted,onPendingChange,onCancel,redirectTo}:{companyId:string;kind:'stop'|'class';initial?:MasterRow;regionOptions?:RegionOptions;onSaved?:(savedName?:string)=>void;onDeleted?:()=>void;onPendingChange?:(pending:boolean)=>void;onCancel?:()=>void;redirectTo?:string}){
  const prefix=useId(),router=useRouter(),busy=useRef(false);const [pending,setPending]=useState(false),[message,setMessage]=useState(''),[messageTone,setMessageTone]=useState<'ok'|'error'>('ok');
  function fail(text:string){setMessageTone('error');setMessage(text);queueAdminToast({title:'Gagal menyimpan data',message:text,tone:'error'});}
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy.current)return;const form=event.currentTarget;const data=new FormData(form);const savedName=String(data.get('name')??'').trim();if(initial?.status==='ACTIVE'&&data.get('status')==='INACTIVE'&&!window.confirm('Nonaktifkan '+initial.name+'? Referensi lama tetap tersimpan.'))return;busy.current=true;setPending(true);onPendingChange?.(true);setMessage('');
    try{const input=kind==='stop'?{name:data.get('name'),regionRegencyId:String(data.get('regionRegencyId')??'')||null,address:String(data.get('address')??'').trim()||null,status:data.get('status')}:{name:data.get('name'),code:data.get('code'),status:data.get('status')};const result=await runAdminAction(companyId,{kind,id:initial?.id,input});if(!result.ok){fail(result.message);return;}setMessageTone('ok');if(!initial)form.reset();if(redirectTo){queueAdminToast({title:initial?(kind==='stop'?'Perubahan titik tersimpan':'Perubahan kelas layanan tersimpan'):(kind==='stop'?'Titik baru ditambahkan':'Kelas layanan baru ditambahkan'),message:savedName?(initial?`${savedName} telah diperbarui.`:`${savedName} kini tampil di daftar.`):undefined,tone:'ok',highlightId:initial?.id,highlightName:savedName||undefined});router.push(redirectTo);router.refresh();}else{router.refresh();}onSaved?.(savedName||undefined);}catch{fail('Koneksi terputus. Coba lagi.');}finally{busy.current=false;setPending(false);onPendingChange?.(false);}
  }
  async function remove(){
    if(!initial||busy.current||!window.confirm(`Hapus ${kind==='stop'?'titik':'kelas layanan'} "${initial.name}" secara permanen?`))return;
    busy.current=true;setPending(true);onPendingChange?.(true);setMessage('');
    try{
      const result=await runAdminAction(companyId,{kind:kind==='stop'?'deleteStop':'deleteClass',id:initial.id});
      if(!result.ok){fail(result.message);return;}
      if(redirectTo){
        queueAdminToast({title:kind==='stop'?'Titik dihapus permanen':'Kelas layanan dihapus permanen',message:`${initial.name} telah dihapus dari daftar.`,tone:'ok'});
        router.push(redirectTo);
      }
      router.refresh();
      onDeleted?.();
    }catch{fail('Koneksi terputus. Coba lagi.');}
    finally{busy.current=false;setPending(false);onPendingChange?.(false);}
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      <fieldset disabled={pending}>
        <div className="admin-fields master-fields-2col">
          <label htmlFor={prefix + 'name'}>
            Nama
            <input id={prefix + 'name'} name="name" required maxLength={120} defaultValue={initial?.name ?? ''} />
          </label>
          {kind === 'stop' ? (
            <>
              <label htmlFor={prefix + 'status'}>
                Status
                <AdminSelect
                  id={prefix + 'status'}
                  name="status"
                  defaultValue={initial?.status ?? 'ACTIVE'}
                  options={[
                    { value: 'ACTIVE', label: 'Aktif' },
                    { value: 'INACTIVE', label: 'Nonaktif' },
                  ]}
                />
              </label>
              <RegionFields
                options={regionOptions}
                initialRegencyId={initial?.regionRegencyId}
                legacyCity={initial?.city}
              />
              <label className="master-field-full" htmlFor={prefix + 'address'}>
                <span className="admin-label-row">
                  Alamat <small>(opsional)</small>
                </span>
                <input
                  id={prefix + 'address'}
                  name="address"
                  maxLength={500}
                  defaultValue={initial?.address ?? ''}
                />
              </label>
            </>
          ) : (
            <>
              <label htmlFor={prefix + 'code'}>
                Kode kelas
                <input
                  id={prefix + 'code'}
                  name="code"
                  required
                  maxLength={32}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  placeholder="executive"
                  defaultValue={initial?.code ?? ''}
                />
              </label>
              <label htmlFor={prefix + 'status'}>
                Status
                <AdminSelect
                  id={prefix + 'status'}
                  name="status"
                  defaultValue={initial?.status ?? 'ACTIVE'}
                  options={[
                    { value: 'ACTIVE', label: 'Aktif' },
                    { value: 'INACTIVE', label: 'Nonaktif' },
                  ]}
                />
              </label>
            </>
          )}
        </div>
        <div className="master-form-footer">
          <div className="master-footer-left">
            {initial?.canDelete === true && (
              <button type="button" className="admin-danger" onClick={() => void remove()}>
                Hapus permanen
              </button>
            )}
          </div>
          <div className="admin-buttons">
            {onCancel && (
              <button type="button" onClick={onCancel}>
                Batal
              </button>
            )}
            <button className="admin-primary" type="submit">
              {pending ? 'Menyimpan…' : initial ? 'Simpan perubahan' : kind === 'stop' ? 'Simpan titik' : 'Tambah kelas'}
            </button>
          </div>
        </div>
        {initial?.canDelete === false && (
          <p className="admin-hint">
            {kind === 'stop'
              ? 'Titik ini masih dipakai pada rute — ubah status menjadi Nonaktif sebagai gantinya.'
              : 'Kelas ini masih dipakai armada, tarif, atau perjalanan — ubah status menjadi Nonaktif sebagai gantinya.'}
          </p>
        )}
      </fieldset>
      {message && (
        <p className={messageTone === 'error' ? 'admin-flash-error' : 'admin-flash-ok'} role={messageTone === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </form>
  );
}
