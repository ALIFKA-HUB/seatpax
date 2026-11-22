'use client';
import {useState,useRef,useId} from 'react';
import {runAdminAction} from '../actions';
import type {OrderedStop,MasterRow} from '@/modules/route/repository';
import AdminSelect from './admin-select';
export default function QuotePreview({companyId,routeId,stops,classes}:{companyId:string;routeId:string;stops:OrderedStop[];classes:MasterRow[]}){
  const prefix=useId(),busy=useRef(false);const [pending,setPending]=useState(false),[message,setMessage]=useState(''),[total,setTotal]=useState<string|null>(null);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(busy.current)return;const data=new FormData(e.currentTarget);busy.current=true;setPending(true);setTotal(null);try{const r=await runAdminAction(companyId,{kind:'quote',routeId,serviceClassId:data.get('class'),fromRouteStopId:data.get('from'),toRouteStopId:data.get('to')});if(r.ok&&r.quote){setTotal(r.quote.total);setMessage('Total tarif template untuk perjalanan pilihan Anda.');}else if(!r.ok)setMessage(r.message);}catch{setMessage('Koneksi terputus. Coba lagi.');}finally{busy.current=false;setPending(false);}}
  const stopOptions=stops.map(s=>({value:s.id,label:`${s.sequence}. ${s.name}`}));
  const hasResult = total !== null || Boolean(message);
  return (
    <form className="admin-form" onSubmit={submit}>
      <fieldset disabled={pending}>
        <div className="admin-fields">
          <label htmlFor={prefix + 'class'}>
            Kelas
            <AdminSelect
              id={prefix + 'class'}
              name="class"
              required
              placeholder="Pilih kelas"
              options={classes.filter(c => c.status === 'ACTIVE').map(c => ({ value: c.id, label: c.name }))}
            />
          </label>
          <label htmlFor={prefix + 'from'}>
            Asal
            <AdminSelect
              id={prefix + 'from'}
              name="from"
              required
              defaultValue={stops[0]?.id ?? ''}
              options={stopOptions}
            />
          </label>
          <label htmlFor={prefix + 'to'}>
            Tujuan
            <AdminSelect
              id={prefix + 'to'}
              name="to"
              required
              defaultValue={stops.at(-1)?.id ?? ''}
              options={stopOptions}
            />
          </label>
        </div>
        <button type="submit" className="admin-primary">
          {pending ? 'Menghitung…' : 'Hitung tarif'}
        </button>
      </fieldset>
      <div role="status" className={hasResult ? 'admin-quote-result' : 'admin-quote-result is-empty'}>
        {total !== null && (
          <strong>
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(BigInt(total))}
          </strong>
        )}
        {message && <p>{message}</p>}
      </div>
    </form>
  );
}
