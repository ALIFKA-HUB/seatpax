import {it,expect} from 'vitest';
import {parseSnackInput} from '@/modules/snack/validation';
it('accepts only a ticket UUID and strips caller identity/time',()=>{expect(parseSnackInput({ticketId:'00000000-0000-4000-8000-000000000001',actorId:'forged',companyId:'forged',claimedAt:'forged'})).toEqual({ticketId:'00000000-0000-4000-8000-000000000001'});expect(()=>parseSnackInput({ticketId:'wrong'})).toThrow();});
