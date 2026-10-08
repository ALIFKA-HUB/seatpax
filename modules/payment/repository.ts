import type {Sql} from 'postgres';
import {createBookingRepository} from '@/modules/booking/repository';
export function createPaymentRepository(client:Sql){return {client,booking:createBookingRepository(client)};}
export type PaymentRepository=ReturnType<typeof createPaymentRepository>;
