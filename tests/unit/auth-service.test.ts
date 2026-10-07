import { describe, it, expect, vi } from 'vitest';
import { requestOtp, verifyEmailOtp, logoutSession, type AuthGateway } from '@/modules/auth/service';
const gateway = (): AuthGateway => ({request:vi.fn(async()=>({error:null})),verify:vi.fn(async()=>({error:null})),logout:vi.fn(async()=>({error:null}))});
describe('OTP service',()=>{
  it.each(['bad','',null,'a'.repeat(255)+'@x.com'])('rejects invalid email %s before provider',async email=>{const g=gateway();expect(await requestOtp(g,email)).toMatchObject({ok:false,code:'invalid_email'});expect(g.request).not.toHaveBeenCalled();});
  it('normalizes email and returns no session',async()=>{const g=gateway();expect(await requestOtp(g,' user@example.com ')).toEqual({ok:true});expect(g.request).toHaveBeenCalledWith('user@example.com');});
  it.each(['123456','abcdefgh','123456789',''])('rejects malformed eight digit code %s',async token=>{const g=gateway();expect(await verifyEmailOtp(g,{email:'user@example.com',token},8)).toMatchObject({code:'invalid_code'});expect(g.verify).not.toHaveBeenCalled();});
  it('verifies eight digit codes',async()=>{const g=gateway();expect(await verifyEmailOtp(g,{email:'user@example.com',token:'01234567'},8)).toEqual({ok:true});expect(g.verify).toHaveBeenCalledWith('user@example.com','01234567');});
  it('rejects invalid verification email',async()=>{expect(await verifyEmailOtp(gateway(),{email:'bad',token:'12345678'},8)).toMatchObject({code:'invalid_email'});});
  it('maps rate limits',async()=>{const g=gateway();g.request=async()=>({error:{status:429}});expect(await requestOtp(g,'u@example.com')).toMatchObject({code:'rate_limited'});});
  it('maps expired code',async()=>{const g=gateway();g.verify=async()=>({error:{code:'otp_expired'}});expect(await verifyEmailOtp(g,{email:'u@example.com',token:'12345678'},8)).toMatchObject({code:'verification_failed'});});
  it('redacts thrown provider errors',async()=>{const g=gateway();g.request=async()=>{throw Error('PRIVATE_SECRET');};const result=await requestOtp(g,'u@example.com');expect(result).toMatchObject({code:'provider_unavailable'});expect(JSON.stringify(result)).not.toContain('PRIVATE_SECRET');});
  it('handles unknown errors without leaking',async()=>{const g=gateway();g.request=async()=>({error:{code:'unknown'}});expect(await requestOtp(g,'u@example.com')).toMatchObject({code:'provider_unavailable'});});
  it('logout succeeds',async()=>{expect(await logoutSession(gateway())).toEqual({ok:true});});
  it('logout failure is not success',async()=>{const g=gateway();g.logout=async()=>({error:{status:500}});expect(await logoutSession(g)).toMatchObject({ok:false});});
});
