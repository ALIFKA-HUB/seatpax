import {it,expect} from 'vitest';
import {parseCompanyStatusInput} from '@/modules/company/validation';
const valid={companyId:'00000000-0000-4000-8000-000000000001',target:'SUSPENDED',expectedStatusRevision:0};
it('accepts a status decision and strips browser actor and timestamps',()=>{
 expect(parseCompanyStatusInput({...valid,actorId:'forged',changedAt:'forged'})).toEqual(valid);
 expect(parseCompanyStatusInput({...valid,target:'ACTIVE',expectedStatusRevision:2147483647})).toEqual({...valid,target:'ACTIVE',expectedStatusRevision:2147483647});
});
it.each([{companyId:'bad'},{target:'DELETED'},{expectedStatusRevision:-1},{expectedStatusRevision:0.5},{expectedStatusRevision:2147483648},{expectedStatusRevision:'0'}, {expectedStatusRevision:NaN}])('rejects invalid decision %j',patch=>{
 expect(()=>parseCompanyStatusInput({...valid,...patch})).toThrow();
});
