import {beforeEach,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
const f=vi.hoisted(()=>({run:vi.fn()}));
vi.mock('@supabase/ssr',()=>({createServerClient:(_u:string,_k:string,options:unknown)=>({auth:{getUser:()=>f.run(options)}})}));
import {updateSession} from '@/lib/supabase/proxy';
type Bridge={cookies:{getAll:()=>unknown;setAll:(values:{name:string;value:string;options?:Record<string,unknown>}[],headers:Record<string,string>)=>void}};
beforeEach(()=>{vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','public');f.run.mockReset();});
it('forwards refreshed cookies and preserves separate batches and headers',async()=>{
 f.run.mockImplementation(async({cookies}:Bridge)=>{cookies.setAll([{name:'a',value:'one',options:{path:'/',sameSite:'lax'}}],{'Cache-Control':'private, no-store','Pragma':'no-cache'});cookies.setAll([{name:'b',value:'two',options:{path:'/'}}],{});return {data:{user:null},error:null};});
 const request=new NextRequest('http://localhost:3000/account');const response=await updateSession(request);
 expect(request.cookies.get('a')?.value).toBe('one');expect(request.cookies.get('b')?.value).toBe('two');
 expect(response.cookies.get('a')).toMatchObject({value:'one',sameSite:'lax',path:'/'});expect(response.cookies.get('b')?.value).toBe('two');
 expect(response.headers.get('x-middleware-request-cookie')).toContain('a=one');expect(response.headers.get('x-middleware-request-cookie')).toContain('b=two');expect(response.headers.get('Cache-Control')).toContain('no-store');expect(response.headers.get('Pragma')).toBe('no-cache');
});
it('passes anonymous navigation without identity payload',async()=>{f.run.mockResolvedValue({data:{user:null},error:null});const r=await updateSession(new NextRequest('http://localhost:3000/login'));expect(r.headers.get('x-middleware-next')).toBe('1');expect(await r.text()).toBe('');expect(r.headers.get('Cache-Control')).toContain('no-store');});
it('network error does not expose credentials',async()=>{f.run.mockRejectedValue(Error('PRIVATE'));const r=await updateSession(new NextRequest('http://localhost:3000/login'));expect(await r.text()).toBe('');});
