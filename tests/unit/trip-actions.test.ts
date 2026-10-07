import {beforeEach,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({identity:vi.fn(),save:vi.fn(),publish:vi.fn(),assignment:vi.fn(),revalidate:vi.fn()}));
vi.mock('@/modules/auth/identity',()=>({getVerifiedUser:f.identity}));vi.mock('@/lib/db',()=>({getDatabase:()=>({$client:{}})}));vi.mock('@/modules/trip/repository',()=>({createTripRepository:()=>({})}));vi.mock('@/modules/trip/draft-service',()=>({createDraftService:()=>({save:f.save})}));vi.mock('@/modules/trip/publication-service',()=>({createPublicationService:()=>({publish:f.publish})}));vi.mock('@/modules/trip/crew-service',()=>({createCrewService:()=>({setAssignment:f.assignment})}));vi.mock('next/cache',()=>({revalidatePath:f.revalidate}));
import {saveTripAction,publishTripAction,setTripCrewAction} from '@/app/admin/trip-actions';import {DomainError} from '@/modules/access/transaction';
const cid='10000000-0000-4000-8000-000000000001',actorId='10000000-0000-4000-8000-000000000002';
beforeEach(()=>{vi.resetAllMocks();f.identity.mockResolvedValue({id:actorId});f.save.mockResolvedValue({tripId:cid,revision:1,status:'DRAFT'});f.publish.mockResolvedValue({tripId:cid,revision:2,status:'OPEN_FOR_SALE'});});
it('denies absent identity and malformed command without mutations',async()=>{
 f.identity.mockResolvedValue(null);expect(await saveTripAction(cid,{input:{}})).toMatchObject({ok:false,code:'forbidden'});expect(await publishTripAction(cid,{id:'bad',revision:1})).toMatchObject({ok:false,code:'validation'});expect(await publishTripAction(cid,{id:cid,revision:0})).toMatchObject({ok:false,code:'validation'});expect(f.save).not.toHaveBeenCalled();expect(f.publish).not.toHaveBeenCalled();
});
it('uses verified actor and forwards only explicit command fields',async()=>{
 const input={name:'Trip'};await saveTripAction(cid,{input,id:cid,revision:1,actorId:'evil',companyId:'evil'});expect(f.save).toHaveBeenCalledWith({actorId,companyId:cid},input,cid,1);
 await publishTripAction(cid,{id:cid,revision:1});expect(f.publish).toHaveBeenCalledWith({actorId,companyId:cid},cid,1);await setTripCrewAction(cid,{id:cid,userId:cid,status:'REVOKED'});expect(f.assignment).toHaveBeenCalledWith({actorId,companyId:cid},cid,cid,'REVOKED');
});
it('preserves safe conflict/blocker messages and conceals arbitrary errors',async()=>{
 f.publish.mockRejectedValue(new DomainError('conflict','Draft berubah.'));expect(await publishTripAction(cid,{id:cid,revision:1})).toMatchObject({ok:false,code:'conflict',message:'Draft berubah.'});
 f.publish.mockRejectedValue(new DomainError('validation','Tarif belum lengkap.'));expect(await publishTripAction(cid,{id:cid,revision:1})).toMatchObject({ok:false,message:'Tarif belum lengkap.'});
 f.save.mockRejectedValue(Error('SQL secret'));expect(JSON.stringify(await saveTripAction(cid,{input:{}}))).not.toContain('secret');
});
