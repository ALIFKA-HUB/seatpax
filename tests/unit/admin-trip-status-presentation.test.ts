import { describe, expect, it } from 'vitest';
import { isTripOpenForSaleNow, tripStatusPresentation } from '@/app/admin/presentation';

describe('tripStatusPresentation', () => {
  const departureAt = '2026-11-22T15:00:00.000Z'; // 22 Nov 2026 22:00 WIB
  const salesCloseAt = '2026-11-22T14:30:00.000Z'; // 22 Nov 2026 21:30 WIB
  const arrivalAt = '2026-11-22T17:00:00.000Z'; // 23 Nov 2026 00:00 WIB

  it('returns Draft for DRAFT regardless of time', () => {
    expect(
      tripStatusPresentation('DRAFT', {
        departureAt,
        salesCloseAt,
        arrivalAt,
        now: '2026-11-23T03:00:00.000Z',
      }),
    ).toEqual({ label: 'Draft', tone: 'neutral' });
  });

  it('returns Penjualan dibuka before sales cutoff', () => {
    expect(
      tripStatusPresentation('OPEN_FOR_SALE', {
        departureAt,
        salesCloseAt,
        arrivalAt,
        now: '2026-11-22T14:00:00.000Z',
      }),
    ).toEqual({ label: 'Penjualan dibuka', tone: 'success' });
  });

  it('returns Penjualan ditutup after salesCloseAt but before departureAt', () => {
    expect(
      tripStatusPresentation('OPEN_FOR_SALE', {
        departureAt,
        salesCloseAt,
        arrivalAt,
        now: '2026-11-22T14:45:00.000Z',
      }),
    ).toEqual({ label: 'Penjualan ditutup', tone: 'warning' });
  });

  it('returns Berlangsung after departureAt and before arrivalAt', () => {
    expect(
      tripStatusPresentation('OPEN_FOR_SALE', {
        departureAt,
        salesCloseAt,
        arrivalAt,
        now: '2026-11-22T16:00:00.000Z',
      }),
    ).toEqual({ label: 'Berlangsung', tone: 'warning' });
  });

  it('returns Selesai after arrivalAt', () => {
    expect(
      tripStatusPresentation('OPEN_FOR_SALE', {
        departureAt,
        salesCloseAt,
        arrivalAt,
        now: '2026-11-23T03:08:00.000Z',
      }),
    ).toEqual({ label: 'Selesai', tone: 'neutral' });
  });

  it('returns Selesai after departureAt when arrivalAt is absent', () => {
    expect(
      tripStatusPresentation('OPEN_FOR_SALE', {
        departureAt,
        salesCloseAt,
        now: '2026-11-23T03:08:00.000Z',
      }),
    ).toEqual({ label: 'Selesai', tone: 'neutral' });
  });

  it('stays backwards-compatible when timing is omitted', () => {
    expect(tripStatusPresentation('OPEN_FOR_SALE')).toEqual({
      label: 'Penjualan dibuka',
      tone: 'success',
    });
  });
});

describe('isTripOpenForSaleNow', () => {
  const departureAt = '2026-11-22T15:00:00.000Z';
  const salesCloseAt = '2026-11-22T14:30:00.000Z';

  it('returns true only when OPEN_FOR_SALE and before earliest cutoff', () => {
    expect(
      isTripOpenForSaleNow('OPEN_FOR_SALE', {
        departureAt,
        salesCloseAt,
        now: '2026-11-22T14:00:00.000Z',
      }),
    ).toBe(true);
    expect(
      isTripOpenForSaleNow('OPEN_FOR_SALE', {
        departureAt,
        salesCloseAt,
        now: '2026-11-22T14:30:00.000Z',
      }),
    ).toBe(false);
    expect(
      isTripOpenForSaleNow('OPEN_FOR_SALE', {
        departureAt,
        salesCloseAt: null,
        now: '2026-11-22T15:00:00.000Z',
      }),
    ).toBe(false);
    expect(
      isTripOpenForSaleNow('DRAFT', {
        departureAt,
        salesCloseAt,
        now: '2026-11-22T14:00:00.000Z',
      }),
    ).toBe(false);
  });
});
