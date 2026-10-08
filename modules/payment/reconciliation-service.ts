import type {PaymentRepository} from './repository';
import type {PaymentProvider} from './types';
import {createPaymentEventService} from './event-service';
import {createConfirmationService} from './confirmation-service';
export function createReconciliationService(repo:PaymentRepository,provider:Pick<PaymentProvider,'status'>){const events=createPaymentEventService(repo,provider,createConfirmationService(repo));return {reconcilePayments:events.reconcilePayments};}
