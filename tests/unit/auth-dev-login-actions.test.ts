import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({headers:vi.fn(),sql:vi.fn(),generateLink:vi.fn(),verifyOtp:vi.fn(),createAdmin:vi.fn(),redirect:vi.fn()}));
vi.mock('next/headers',()=>({headers:f.headers}));
vi.mock('next/navigation',()=>({redirect:f.redirect}));
vi.mock('@supabase/supabase-js',()=>({createClient:f.createAdmin}));
vi.mock('@/lib/db',()=>({getDatabase:()=>({$client:f.sql})}));
vi.mock('@/lib/supabase/server',()=>({createServerSupabaseClient:async()=>({auth:{verifyOtp:f.verifyOtp}})}));
import {quickLoginAction} from '@/app/login/dev-actions';
beforeEach(()=>{
 vi.resetAllMocks();vi.stubEnv('NODE_ENV','development');vi.stubEnv('DEV_QUICK_LOGIN','true');vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://slbkhdsfafcxaxqdxmet.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only-secret');
 f.headers.mockResolvedValue(new Headers({host:'localhost:3001',origin:'http://localhost:3001'}));f.sql.mockResolvedValue([{id:'real-user'}]);
 f.createAdmin.mockReturnValue({auth:{admin:{generateLink:f.generateLink}}});f.generateLink.mockResolvedValue({data:{properties:{hashed_token:'private-token'}},error:null});f.verifyOtp.mockResolvedValue({data:{user:{id:'real-user'}},error:null});f.redirect.mockImplementation(()=>{throw Error('NEXT_REDIRECT')});
});
afterEach(()=>vi.unstubAllEnvs());
function form(account='helpdesk'){const data=new FormData();data.set('account',account);return data;}
it('rejects production and forged identities before any privileged work',async()=>{
 vi.stubEnv('NODE_ENV','production');expect(await quickLoginAction({message:''},form())).toHaveProperty('message');expect(f.createAdmin).not.toHaveBeenCalled();expect(f.sql).not.toHaveBeenCalled();
 vi.stubEnv('NODE_ENV','development');expect(await quickLoginAction({message:''},form('stranger@example.com'))).toHaveProperty('message');expect(f.sql).not.toHaveBeenCalled();
});
it('rejects a foreign origin before creating a session',async()=>{f.headers.mockResolvedValue(new Headers({host:'localhost:3001',origin:'https://evil.example'}));await quickLoginAction({message:''},form());expect(f.createAdmin).not.toHaveBeenCalled();expect(f.sql).not.toHaveBeenCalled();});
it('consumes hash server-side and redirects to the preset role workspace',async()=>{
 await expect(quickLoginAction({message:''},form())).rejects.toThrow('NEXT_REDIRECT');expect(f.generateLink).toHaveBeenCalledWith({type:'magiclink',email:'johancocthird+helpdesk@gmail.com'});expect(f.verifyOtp).toHaveBeenCalledWith({token_hash:'private-token',type:'email'});expect(f.redirect).toHaveBeenCalledWith('/helpdesk');
});
it('denies missing identities without generating a link',async()=>{f.sql.mockResolvedValue([]);await quickLoginAction({message:''},form());expect(f.generateLink).not.toHaveBeenCalled();expect(f.redirect).not.toHaveBeenCalled();});
it('sanitizes provider failure and never returns secret data',async()=>{f.generateLink.mockRejectedValue(Error('private-token'));const r=await quickLoginAction({message:''},form());expect(JSON.stringify(r)).not.toContain('private-token');expect(f.redirect).not.toHaveBeenCalled();});
