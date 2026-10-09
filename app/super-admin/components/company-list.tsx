'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import type {CompanySummary} from '@/modules/company/types';
import {changeCompanyStatusAction} from '../actions';
import {applyCompanyResult,createCompanyController,reconcileCompanyRows} from '../company-ui-state';
import {CompanyStatusControl} from './company-status-control';
export function CompanyList({companies}:{companies:CompanySummary[]}){
 const router=useRouter(),[results,setRows]=useState(companies),[,render]=useState(0),trigger=useRef<HTMLElement|null>(null);
 const [controller]=useState(()=>createCompanyController(changeCompanyStatusAction,()=>router.refresh()));
 const rows=reconcileCompanyRows(companies,results);
 const state=controller.state(),redraw=()=>render(n=>n+1);
 async function confirm(){const task=controller.confirm();redraw();const result=await task;if(result)setRows(old=>applyCompanyResult(old,result.company));redraw();}
 if(!rows.length)return <p>Belum ada PO.</p>;
 return <div className="company-list">{rows.map(company=><section className="company-row" key={company.id}><h2>{company.name}</h2><p>{company.slug} · {company.status==='ACTIVE'?'Aktif':'Disuspend'}</p><CompanyStatusControl company={state.confirming?.id===company.id?state.confirming:company} confirming={state.confirming?.id===company.id} pending={state.pending} message={state.companyId===company.id?state.message:''} onRequest={()=>{trigger.current=document.activeElement as HTMLElement;controller.request(company);redraw();}} onCancel={()=>{controller.cancel();redraw();requestAnimationFrame(()=>trigger.current?.focus());}} onConfirm={()=>void confirm()} /></section>)}</div>;
}
