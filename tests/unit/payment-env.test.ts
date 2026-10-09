import {it,expect} from 'vitest';
import {parsePaymentEnv} from '@/lib/env/payment';
const input={MIDTRANS_SERVER_KEY:'SB-Mid-server-test',MIDTRANS_CLIENT_KEY:'SB-Mid-client-test',MIDTRANS_MERCHANT_ID:'GTEST',TICKET_ENCRYPTION_KEY:Buffer.alloc(32,7).toString('base64'),MIDTRANS_ENVIRONMENT:'sandbox'};
it('accepts only complete sandbox credentials and a 32-byte encryption key',()=>{expect(parsePaymentEnv(input).merchantId).toBe('GTEST');expect(()=>parsePaymentEnv({...input,MIDTRANS_ENVIRONMENT:'production'})).toThrow();expect(()=>parsePaymentEnv({...input,TICKET_ENCRYPTION_KEY:'a'})).toThrow();expect(()=>parsePaymentEnv({...input,MIDTRANS_SERVER_KEY:''})).toThrow();});

it('rejects empty Sandbox credential suffixes',()=>{expect(()=>parsePaymentEnv({...input,MIDTRANS_SERVER_KEY:'SB-Mid-server-'})).toThrow();expect(()=>parsePaymentEnv({...input,MIDTRANS_CLIENT_KEY:'SB-Mid-client-'})).toThrow();});
it('accepts dashboard keys without SB prefix while requiring sandbox environment',()=>{expect(parsePaymentEnv({...input,MIDTRANS_SERVER_KEY:'Mid-server-example',MIDTRANS_CLIENT_KEY:'Mid-client-example'}).merchantId).toBe('GTEST');expect(()=>parsePaymentEnv({...input,MIDTRANS_ENVIRONMENT:'production'})).toThrow();});

