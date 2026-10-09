import {z} from 'zod';
const schema=z.object({MIDTRANS_ENVIRONMENT:z.literal('sandbox'),MIDTRANS_SERVER_KEY:z.string().regex(/^(?:SB-)?Mid-server-[A-Za-z0-9_-]+$/),MIDTRANS_CLIENT_KEY:z.string().regex(/^(?:SB-)?Mid-client-[A-Za-z0-9_-]+$/),MIDTRANS_MERCHANT_ID:z.string().min(1),TICKET_ENCRYPTION_KEY:z.string().refine(s=>/^[A-Za-z0-9+/]{43}=$/.test(s)&&Buffer.from(s,'base64').length===32)});
export function parsePaymentEnv(input:unknown){const v=schema.safeParse(input);if(!v.success)throw new Error('Sandbox payment configuration is incomplete.');return {serverKey:v.data.MIDTRANS_SERVER_KEY,clientKey:v.data.MIDTRANS_CLIENT_KEY,merchantId:v.data.MIDTRANS_MERCHANT_ID,keys:{v1:Buffer.from(v.data.TICKET_ENCRYPTION_KEY,'base64')},keyVersion:'v1' as const};}
export type PaymentEnv=ReturnType<typeof parsePaymentEnv>;

