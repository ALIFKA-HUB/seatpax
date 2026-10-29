import {beforeEach,it,expect,vi} from 'vitest';
const retry=vi.hoisted(()=>vi.fn());
vi.mock('@/app/helpdesk/actions',()=>({changeComplaintAction:vi.fn(),retryComplaintEmailAction:retry}));
import {retryMailWithRefresh} from '@/app/helpdesk/components/case-actions';

beforeEach(()=>vi.clearAllMocks());

it('refreshes detail after a retry succeeds so email state is reloaded',async()=>{
 retry.mockResolvedValue({ok:true,message:'Percobaan pengiriman dijadwalkan.'});
 const refresh=vi.fn();
 await expect(retryMailWithRefresh('job-id',refresh)).resolves.toMatchObject({ok:true});
 expect(retry).toHaveBeenCalledWith(expect.any(FormData));
 expect(refresh).toHaveBeenCalledOnce();
});

it('does not refresh detail when the retry action did not queue a job',async()=>{
 retry.mockResolvedValue({ok:false,message:'Email ini tidak dapat dijadwalkan ulang.'});
 const refresh=vi.fn();
 await expect(retryMailWithRefresh('job-id',refresh)).resolves.toMatchObject({ok:false});
 expect(refresh).not.toHaveBeenCalled();
});
