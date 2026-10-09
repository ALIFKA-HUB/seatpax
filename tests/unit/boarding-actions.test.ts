import {it,expect,vi} from 'vitest';
import {createBoardingActions} from '@/app/crew/boarding-action-core';
const id='00000000-0000-4000-8000-000000000001';
function setup(){const resolve=vi.fn(async()=>({ticketId:id})),board=vi.fn(async()=>({boarding:{id},alreadyBoarded:false})),getActor=vi.fn(async()=>({userId:id,role:'CREW' as const}));return {resolve,board,getActor,actions:createBoardingActions({getActor,resolve,board})};}
it('derives actor from session and passes only validated boarding fields',async()=>{const s=setup();expect((await s.actions.board(id,{ticketId:id,stopId:id,source:'QR',actorId:'forged'})).ok).toBe(true);expect(s.board).toHaveBeenCalledWith({userId:id,role:'CREW'},id,{ticketId:id,stopId:id,source:'QR'});});
it('rejects malformed QR without resolve or mutation',async()=>{const s=setup();for(const token of ['https://evil.test', 'A'.repeat(100000)])expect((await s.actions.resolve(id,token)).ok).toBe(false);expect(s.resolve).not.toHaveBeenCalled();expect(s.board).not.toHaveBeenCalled();});
it('keeps resolve read-only and hides unexpected errors',async()=>{const s=setup();await s.actions.resolve(id,'A'.repeat(43));expect(s.board).not.toHaveBeenCalled();s.resolve.mockRejectedValueOnce(new Error('private ticket details'));expect(await s.actions.resolve(id,'A'.repeat(43))).toEqual({ok:false,message:'Tiket tidak tersedia pada perjalanan ini.'});});
