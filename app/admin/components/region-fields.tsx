'use client';
import {useId,useState,useRef} from 'react';
import type {RegionOptions} from '@/modules/regions/types';

export default function RegionFields({options,initialRegencyId,legacyCity}:{options:RegionOptions;initialRegencyId?:string|null;legacyCity?:string}) {
  const prefix=useId(),input=useRef<HTMLInputElement>(null);
  const initial=options.regencies.find(r=>r.id===initialRegencyId);
  const [province,setProvince]=useState(initial?.provinceId??'');
  const [value,setValue]=useState(initial?`${initial.name} [${initial.code}]`:'');
  const [replacing,setReplacing]=useState(false);
  const choices=options.regencies.filter(r=>r.provinceId===province);
  const selected=choices.find(r=>`${r.name} [${r.code}]`===value);
  const retained=!replacing&&!value?initialRegencyId??'':'';
  const unavailable=!options.provinces.length||!options.regencies.length;
  return <>
    {legacyCity&&!initial&&<p className="region-guidance">{initialRegencyId?'Wilayah lama tidak tersedia untuk pilihan baru':'Wilayah belum dipetakan'}: <strong>{legacyCity}</strong>. Pilih wilayah untuk menggantinya; perubahan lain tetap dapat disimpan.</p>}
    {unavailable&&<p className="region-guidance" role="status">Katalog wilayah belum tersedia. Hubungi pengelola untuk sinkronisasi atau coba muat ulang.</p>}
    <label htmlFor={prefix+'province'}>Provinsi<select id={prefix+'province'} value={province} disabled={unavailable} onChange={event=>{setProvince(event.target.value);setValue('');setReplacing(true);input.current?.setCustomValidity('');}}><option value="">Pilih provinsi</option>{options.provinces.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label htmlFor={prefix+'regency'}>Kota / kabupaten<input ref={input} id={prefix+'regency'} list={prefix+'choices'} value={value} disabled={unavailable||!province} required={replacing||!legacyCity} placeholder="Ketik lalu pilih nama lengkap" autoComplete="off" aria-describedby={prefix+'help'} onChange={event=>{setValue(event.target.value);setReplacing(true);event.target.setCustomValidity(event.target.value&&!choices.some(r=>`${r.name} [${r.code}]`===event.target.value)?'Pilih nama lengkap beserta kode dari daftar.':'');}} onBlur={event=>event.target.setCustomValidity(value&&!selected?'Pilih nama lengkap beserta kode dari daftar.':'')}/><datalist id={prefix+'choices'}>{choices.map(r=><option key={r.id} value={`${r.name} [${r.code}]`}/>)}</datalist><small id={prefix+'help'}>Kota dan Kabupaten merupakan pilihan berbeda.</small></label>
    <input type="hidden" name="regionRegencyId" value={selected?.id??retained}/>
  </>;
}
