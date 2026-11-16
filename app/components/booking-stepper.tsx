import {Armchair,Check,CreditCard,Ticket} from '@phosphor-icons/react/ssr';

const STEPS=[
 {id:1,label:'Pilih Kursi',Icon:Armchair},
 {id:2,label:'Data & Bayar',Icon:CreditCard},
 {id:3,label:'Tiket Siap',Icon:Ticket},
] as const;

export default function BookingStepper({step}:{step:1|2|3}){
 return <nav className="pf-stepper" aria-label="Tahap pemesanan">
  <ol className="pf-stepper-list">
   {STEPS.map((item,index)=>{
    const done=item.id<step;
    const current=item.id===step;
    const Icon=item.Icon;
    return <li key={item.id} className={`pf-step${done?' is-done':current?' is-current':''}`} aria-current={current?'step':undefined}>
     <span className="pf-step-badge" aria-hidden="true">
      {done?<Check size={14} weight="bold"/>:<Icon size={15} weight={current?'fill':'regular'}/>}
     </span>
     <span className="pf-step-text">
      <small>Langkah {item.id}</small>
      <strong>{item.label}</strong>
     </span>
     {index<STEPS.length-1&&<span className="pf-step-connector" aria-hidden="true"/>}
    </li>;
   })}
  </ol>
 </nav>;
}
