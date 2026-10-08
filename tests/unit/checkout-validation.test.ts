import {it,expect} from 'vitest';
import {parseCheckout} from '@/modules/booking/validation';
const input={holdId:'00000000-0000-4000-8000-000000000001',requestKey:'00000000-0000-4000-8000-000000000002',mode:'OTHER',name:'  Budi  ',phone:'0812 3456 7890'};
it('normalizes passenger contact while rejecting malformed identifiers and oversized names',()=>{expect(parseCheckout(input)).toMatchObject({name:'Budi',phone:'+6281234567890'});for(const patch of [{name:''},{name:'x'.repeat(121)},{phone:'123'},{phone:'+0012345678'},{holdId:'bad'},{mode:'GUEST'}])expect(()=>parseCheckout({...input,...patch})).toThrow();});
