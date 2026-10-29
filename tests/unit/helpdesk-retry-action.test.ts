import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({retryMail:vi.fn(),drain:vi.fn(),revalidate:vi.fn(),context:vi.fn(),client:{}}));
vi.mock('@/lib/db',()=>({getDatabase:()=>({$client:mocks.client})}));
vi.mock('@/app/helpdesk/data',()=>({helpdeskContext:mocks.context}));
vi.mock('@/modules/helpdesk/mail-worker',()=>({drainHelpdeskMail:mocks.drain}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidate}));
import {retryComplaintEmailAction} from '@/app/helpdesk/actions';

beforeEach(()=>{vi.clearAllMocks();mocks.context.mockResolvedValue({ctx:{actorId:'a',companyId:'c'},staff:{retryMail:mocks.retryMail},config:{}});mocks.drain.mockResolvedValue({accepted:0});});

it('does not drain unrelated jobs or claim a retry when update matched no job',async()=>{
 mocks.retryMail.mockResolvedValue(false);
 const result=await retryComplaintEmailAction(new FormData());
 expect(result).toEqual({ok:false,message:'Email ini tidak dapat dijadwalkan ulang.'});
 expect(mocks.drain).not.toHaveBeenCalled();
});

it('drains mail after a retryable job was queued',async()=>{
 mocks.retryMail.mockResolvedValue(true);
 const result=await retryComplaintEmailAction(new FormData());
 expect(result).toEqual({ok:true,message:'Percobaan pengiriman dijadwalkan.'});
 expect(mocks.drain).toHaveBeenCalledWith(mocks.client,{}, {limit:3});
});
