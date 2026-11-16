import {describe,expect,it,vi} from 'vitest';
import type {BookingView} from '@/modules/booking/types';
import type {PaymentRepository} from '@/modules/payment/repository';
import {createPaymentSyncService} from '@/modules/payment/sync-service';

const userId='11111111-1111-4111-8111-111111111111';
const bookingId='22222222-2222-4222-8222-222222222222';

function baseBooking(overrides:Partial<BookingView>={}):BookingView{
 return {
  id:bookingId,
  bookerId:userId,
  status:'PENDING_PAYMENT',
  mode:'SELF',
  passenger:{name:'Budi',phone:'081234567890'},
  email:'budi@example.test',
  amount:'60000',
  orderId:'seatpax-order-1',
  effectiveExpiresAt:'2026-11-16T03:30:00Z',
  serverNow:'2026-11-16T03:20:00Z',
  ticketId:null,
  paymentStatus:'PENDING',
  creationState:'READY',
  snapshot:{tripName:'Demo',vehicleName:'Shuttle',plateNumber:'D 1 A',seatCode:'01',fromName:'A',toName:'B',departureAt:'2026-11-16T06:00:00Z'},
  ...overrides,
 };
}

function repoFor(view:BookingView|null):PaymentRepository{
 return {
  client:{} as PaymentRepository['client'],
  booking:{view:vi.fn().mockResolvedValue(view)} as unknown as PaymentRepository['booking'],
 };
}

describe('payment sync service',()=>{
 it('applies settled provider status on refresh even without webhook delivery',async()=>{
  const confirmed=baseBooking({status:'CONFIRMED',paymentStatus:'PAID',ticketId:'ticket-1'});
  const statusFn=vi.fn().mockResolvedValue({orderId:'seatpax-order-1',transactionId:'txn-1',merchantId:'M1',amount:'60000',currency:'IDR',status:'settlement',fraudStatus:'accept',paymentType:'qris',verifiedAt:'2026-11-16T03:25:00Z'});
  const apply=vi.fn().mockResolvedValue(confirmed);
  const service=createPaymentSyncService(repoFor(baseBooking()),{status:statusFn},{apply});

  const result=await service.syncMine(userId,bookingId);
  expect(statusFn).toHaveBeenCalledWith('seatpax-order-1');
  expect(apply).toHaveBeenCalledTimes(1);
  expect(result?.status).toBe('CONFIRMED');
  expect(result?.ticketId).toBe('ticket-1');
 });

 it('does not invoke confirmation when provider payment is still pending or unstarted',async()=>{
  const statusFn=vi.fn().mockResolvedValue({orderId:'seatpax-order-1',transactionId:'txn-1',merchantId:'M1',amount:'60000',currency:'IDR',status:'pending',fraudStatus:'accept',paymentType:'qris',verifiedAt:'2026-11-16T03:25:00Z'});
  const apply=vi.fn();
  const pendingResult=await createPaymentSyncService(repoFor(baseBooking()),{status:statusFn},{apply}).syncMine(userId,bookingId);
  expect(pendingResult?.status).toBe('PENDING_PAYMENT');
  expect(apply).not.toHaveBeenCalled();

  const statusUnstarted=vi.fn();
  await createPaymentSyncService(repoFor(baseBooking({creationState:'NOT_STARTED'})),{status:statusUnstarted},{apply}).syncMine(userId,bookingId);
  expect(statusUnstarted).not.toHaveBeenCalled();
 });

 it('falls back cleanly to persisted booking when provider status throws',async()=>{
  const current=baseBooking();
  const statusFn=vi.fn().mockRejectedValue(new Error('network timeout'));
  const apply=vi.fn();
  const result=await createPaymentSyncService(repoFor(current),{status:statusFn},{apply}).syncMine(userId,bookingId);
  expect(result).toEqual(current);
  expect(apply).not.toHaveBeenCalled();
 });
});
