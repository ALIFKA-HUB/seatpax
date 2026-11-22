'use client';
import {useState,useTransition} from 'react';
import {manageHelpdeskStaff} from '../helpdesk-actions';
import AdminSelect from './admin-select';
export default function HelpdeskStaffForm(){const [message,setMessage]=useState(''),[busy,start]=useTransition();return <form className="hd-panel hd-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);start(async()=>{const r=await manageHelpdeskStaff(f);setMessage(r.message);});}}><h2>Akses Petugas Helpdesk</h2><p>Petugas harus sudah pernah masuk dan memverifikasi email di Seatpax.</p><label>Email akun<input name="email" type="email" required maxLength={254}/></label><label>Status akses<AdminSelect name="status" defaultValue="ACTIVE" options={[{value:'ACTIVE',label:'Aktif'},{value:'DISABLED',label:'Nonaktif'}]}/></label><button className="hd-primary" disabled={busy}>Simpan akses</button>{message&&<p role="status">{message}</p>}</form>;}
