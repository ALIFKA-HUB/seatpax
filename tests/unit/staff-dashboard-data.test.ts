import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({user:vi.fn(),read:vi.fn(),repo:vi.fn(),database:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/navigation',()=>({redirect:()=>{throw Error('LOGIN_REDIRECT');}}));
vi.mock('@/modules/auth/identity',()=>({getVerifiedUser:f.user}));
vi.mock('@/lib/db',()=>({getDatabase:f.database}));
vi.mock('@/modules/staff-directory/repository',()=>({createStaffDirectoryRepository:f.repo}));
vi.mock('@/modules/staff-directory/service',()=>({createStaffDirectoryService:()=>({read:f.read})}));
import {dashboardData} from '@/app/super-admin/dashboard-data';
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('NODE_ENV','development');vi.stubEnv('SEATPAX_COMPANY_ID',undefined);f.user.mockResolvedValue({id:'verified-actor'});f.database.mockReturnValue({$client:'database-client'});f.read.mockResolvedValue({rows:[]});});
afterEach(()=>vi.unstubAllEnvs());
it('takes actor and company from trusted server context, ignoring browser scope fields',async()=>{
 await dashboardData({q:'  lookup  ',status:'active',page:'2',companyId:'other-company',userId:'attacker'} as Parameters<typeof dashboardData>[0]);
 expect(f.read).toHaveBeenCalledWith('verified-actor','00000000-0000-4000-8000-000000000001',{q:'lookup',status:'active',page:2});
});
it('redirects unauthenticated callers before accessing the database',async()=>{
 f.user.mockResolvedValue(null);await expect(dashboardData({})).rejects.toThrow('LOGIN_REDIRECT');expect(f.database).not.toHaveBeenCalled();expect(f.read).not.toHaveBeenCalled();
});
it('fails without a production company instead of reading a demo scope',async()=>{
 vi.stubEnv('NODE_ENV','production');await expect(dashboardData({})).rejects.toMatchObject({code:'unavailable'});expect(f.database).not.toHaveBeenCalled();
});
it('maps database bootstrap failure to a safe unavailable state',async()=>{
 f.database.mockImplementation(()=>{throw Error('private database configuration');});
 await expect(dashboardData({})).rejects.toMatchObject({code:'unavailable'});
 expect(f.read).not.toHaveBeenCalled();
});
