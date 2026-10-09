import {expect,it} from 'vitest';
import {assertManifestCompany,parseBoardingInput,parseTicketToken} from '@/modules/boarding/validation';
const id='00000000-0000-4000-8000-000000000001';
it('accepts only exact opaque QR tokens',()=>{expect(parseTicketToken('A'.repeat(43))).toBe('A'.repeat(43));for(const token of ['https://example.com','A'.repeat(44),'A'.repeat(42),' '+ 'A'.repeat(43),'A'.repeat(100000)])expect(()=>parseTicketToken(token)).toThrow();});
it('validates ticket/stop/source and strips caller identity',()=>{expect(parseBoardingInput({ticketId:id,stopId:id,source:'QR',actorId:id})).toEqual({ticketId:id,stopId:id,source:'QR'});for(const input of [{ticketId:'bad',stopId:id,source:'QR'},{ticketId:id,stopId:id,source:'AUTO'},{ticketId:id,stopId:'bad',source:'MANIFEST'}])expect(()=>parseBoardingInput(input)).toThrow();});
it('rejects a mismatched company URL',()=>{expect(()=>assertManifestCompany(id,'other-company')).toThrow();expect(()=>assertManifestCompany(id,id)).not.toThrow();});
