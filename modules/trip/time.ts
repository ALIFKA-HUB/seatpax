import { DomainError } from '@/modules/access/transaction';
import type { IsoWeekday, RecurringScheduleOccurrence } from './types';

export const MAX_RECURRING_SPAN_DAYS = 90;
export const MAX_RECURRING_TRIPS = 60;
const DAY_MS = 86_400_000;

export function parseWibInstant(input: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(input);
  if (!match) throw new DomainError('validation', 'Gunakan tanggal dan jam WIB yang valid.');
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const local = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    year < 2000 ||
    year > 9999 ||
    local.getUTCFullYear() !== year ||
    local.getUTCMonth() !== month - 1 ||
    local.getUTCDate() !== day ||
    local.getUTCHours() !== hour ||
    local.getUTCMinutes() !== minute
  ) {
    throw new DomainError('validation', 'Tanggal atau jam WIB tidak valid.');
  }
  return new Date(local.getTime() - 7 * 3600000).toISOString();
}

export function parseWibDateMs(input: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) throw new DomainError('validation', 'Gunakan format tanggal YYYY-MM-DD yang valid.');
  const [year, month, day] = match.slice(1).map(Number);
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (
    year < 2000 ||
    year > 9999 ||
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new DomainError('validation', 'Tanggal WIB tidak valid.');
  }
  return ms;
}

export function parseWibTime(input: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(input);
  if (!match) throw new DomainError('validation', 'Gunakan jam berangkat WIB yang valid (HH:MM).');
  const [hour, minute] = match.slice(1).map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new DomainError('validation', 'Jam berangkat WIB tidak valid.');
  }
  return input;
}

export function formatUtcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isoWeekdayFromUtcMs(ms: number): IsoWeekday {
  const day = new Date(ms).getUTCDay();
  return (day === 0 ? 7 : day) as IsoWeekday;
}

export function expandRecurringSchedule(params: {
  startDate: string;
  endDate: string;
  departureTime: string;
  weekdays: readonly number[];
  salesCloseBeforeMin: number | null;
}): RecurringScheduleOccurrence[] {
  const startMs = parseWibDateMs(params.startDate);
  const endMs = parseWibDateMs(params.endDate);
  if (endMs < startMs) {
    throw new DomainError('validation', 'Tanggal akhir harus sama atau setelah tanggal mulai.');
  }
  const spanDays = Math.round((endMs - startMs) / DAY_MS) + 1;
  if (spanDays > MAX_RECURRING_SPAN_DAYS) {
    throw new DomainError(
      'validation',
      `Rentang tanggal maksimal ${MAX_RECURRING_SPAN_DAYS} hari dalam satu kali buat.`,
    );
  }
  const time = parseWibTime(params.departureTime);
  const selected = new Set<number>(
    params.weekdays.filter(d => Number.isInteger(d) && d >= 1 && d <= 7),
  );
  if (selected.size === 0) {
    throw new DomainError('validation', 'Pilih minimal satu hari beroperasi.');
  }
  if (
    params.salesCloseBeforeMin !== null &&
    (!Number.isInteger(params.salesCloseBeforeMin) ||
      params.salesCloseBeforeMin < 0 ||
      params.salesCloseBeforeMin > 10080)
  ) {
    throw new DomainError('validation', 'Batas tutup penjualan harus 0–10080 menit.');
  }

  const occurrences: RecurringScheduleOccurrence[] = [];
  for (let ms = startMs; ms <= endMs; ms += DAY_MS) {
    const isoWeekday = isoWeekdayFromUtcMs(ms);
    if (!selected.has(isoWeekday)) continue;
    const date = formatUtcDate(ms);
    const departureWib = `${date}T${time}`;
    const departureAt = parseWibInstant(departureWib);
    const salesCloseAt =
      params.salesCloseBeforeMin === null
        ? null
        : new Date(Date.parse(departureAt) - params.salesCloseBeforeMin * 60000).toISOString();
    occurrences.push({ date, isoWeekday, departureWib, departureAt, salesCloseAt });
    if (occurrences.length > MAX_RECURRING_TRIPS) {
      throw new DomainError(
        'validation',
        `Maksimal ${MAX_RECURRING_TRIPS} perjalanan dalam satu kali buat. Perkecil rentang tanggal.`,
      );
    }
  }
  if (occurrences.length === 0) {
    throw new DomainError(
      'validation',
      'Tidak ada tanggal pada rentang tersebut yang cocok dengan hari beroperasi yang dipilih.',
    );
  }
  return occurrences;
}

export function toWibInput(iso: string): string {
  return new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 16);
}

export function intervalCutoff(originDepartureIso: string, globalIso: string | null): string {
  return globalIso && Date.parse(globalIso) < Date.parse(originDepartureIso)
    ? globalIso
    : originDepartureIso;
}
