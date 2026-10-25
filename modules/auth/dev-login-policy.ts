import {DEV_PROJECT_REF} from '@/lib/env/migration';

export const quickLoginAccounts = [
 {id:'customer',label:'Customer',email:'johancocthird@gmail.com',href:'/trips'},
 {id:'admin-a',label:'Admin operasional - PO A',email:'johancocthird+admina@gmail.com',href:'/admin'},
 {id:'helpdesk',label:'Petugas Helpdesk - PO A',email:'johancocthird+helpdesk@gmail.com',href:'/helpdesk'},
 {id:'crew-a',label:'Crew - PO A',email:'johancocthird+crewa@gmail.com',href:'/crew'},
 {id:'super-admin',label:'Super Admin',email:'johancocthird+super@gmail.com',href:'/super-admin/companies'},
 {id:'admin-b',label:'Admin operasional - PO B',email:'johancocthird+adminb@gmail.com',href:'/admin'},
 {id:'crew-b',label:'Crew - PO B',email:'johancocthird+crewb@gmail.com',href:'/crew'},
] as const;
export function quickLoginAccount(id:unknown){return quickLoginAccounts.find(a=>a.id===id)??null;}
export function quickLoginEnabled(env:Record<string,string|undefined>,host:string){
 if(env.NODE_ENV!=='development'||env.DEV_QUICK_LOGIN!=='true'||env.NEXT_PUBLIC_SUPABASE_URL!==`https://${DEV_PROJECT_REF}.supabase.co`)return false;
 try {const u=new URL('http://'+host);return ['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&u.host===host&&!u.username&&!u.password&&u.pathname==='/';}catch{return false;}
}
export function quickLoginAllowed(env:Record<string,string|undefined>,host:string,origin:string|null){
 if(!quickLoginEnabled(env,host)||!origin)return false;
 try{const u=new URL(origin);return ['http:','https:'].includes(u.protocol)&&u.host===host&&u.origin===origin;}catch{return false;}
}
