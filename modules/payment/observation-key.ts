import {createHash} from 'node:crypto';
import type {ProviderObservation} from './types';
export function observationKey(o:ProviderObservation){return createHash('sha256').update(JSON.stringify(['midtrans-status-v1',o.orderId,o.transactionId,o.merchantId,o.amount,o.currency,o.status,o.fraudStatus,o.paymentType])).digest('hex');}
