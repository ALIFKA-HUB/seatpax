import {describe,it,expect} from 'vitest';
import {quickLoginEnabled,quickLoginAllowed,quickLoginAccount} from '@/modules/auth/dev-login-policy';
const env={NODE_ENV:'development',DEV_QUICK_LOGIN:'true',NEXT_PUBLIC_SUPABASE_URL:'https://slbkhdsfafcxaxqdxmet.supabase.co'};
describe('local testing login boundary',()=>{
 it('enables only an explicitly enabled dev project on loopback',()=>{
  expect(quickLoginEnabled(env,'localhost:3001')).toBe(true);
  for(const change of [{NODE_ENV:'production'},{NODE_ENV:'test'},{DEV_QUICK_LOGIN:'false'},{NEXT_PUBLIC_SUPABASE_URL:'https://other.supabase.co'}])expect(quickLoginEnabled({...env,...change},'localhost:3001')).toBe(false);
  for(const host of ['public.example:3001','localhost.evil:3001','192.168.1.5:3001',''])expect(quickLoginEnabled(env,host)).toBe(false);
 });
 it('requires matching local action origin',()=>{
  expect(quickLoginAllowed(env,'localhost:3001','http://localhost:3001')).toBe(true);
  for(const origin of [null,'null','https://evil.example','http://localhost:3002','http://localhost.evil:3001'])expect(quickLoginAllowed(env,'localhost:3001',origin)).toBe(false);
  expect(quickLoginAllowed({...env,NODE_ENV:'production'},'localhost:3001','http://localhost:3001')).toBe(false);
 });
 it('accepts preset IDs, never a caller-supplied email',()=>{
  expect(quickLoginAccount('helpdesk')?.email).toBe('johancocthird+helpdesk@gmail.com');
  for(const id of ['anyone@gmail.com','__proto__','constructor',null,{},''])expect(quickLoginAccount(id)).toBeNull();
 });
});
