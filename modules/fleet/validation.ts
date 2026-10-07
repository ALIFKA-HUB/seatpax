import { z } from 'zod';
import { cellTypes, type TemplateInput, type VehicleInput } from './types';

const optionalText = (max: number) => z.string().trim().max(max).nullable().transform(value => value || null);
const cell = z.object({
  rowIndex: z.number().int().min(0), colIndex: z.number().int().min(0),
  type: z.enum(cellTypes), label: optionalText(40),
  seatCode: z.string().trim().toUpperCase().nullable(),
});
const template = z.object({
  name: z.string().trim().min(1).max(120), rows: z.number().int().min(1).max(30),
  cols: z.number().int().min(1).max(8), cells: z.array(cell).max(240),
}).superRefine((input, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (input.cells.length !== input.rows * input.cols) fail('Grid harus lengkap.');
  const coordinates = new Set<string>();
  const codes = new Set<string>();
  let seats = 0;
  for (const item of input.cells) {
    const coordinate = `${item.rowIndex}:${item.colIndex}`;
    if (coordinates.has(coordinate) || item.rowIndex >= input.rows || item.colIndex >= input.cols) fail('Koordinat grid tidak valid.');
    coordinates.add(coordinate);
    if (item.type === 'SEAT') {
      seats++;
      if (!item.seatCode || !/^[A-Z0-9-]{1,8}$/.test(item.seatCode)) fail('Kode kursi harus 1–8 huruf, angka, atau tanda hubung.');
      if (item.seatCode && codes.has(item.seatCode)) fail('Kode kursi harus unik.');
      if (item.seatCode) codes.add(item.seatCode);
    } else if (item.seatCode !== null) fail('Sel selain kursi tidak memiliki kode kursi.');
  }
  if (!seats) fail('Template harus memiliki minimal satu kursi.');
});
const vehicle = z.object({
  name: z.string().trim().min(1).max(120),
  plateNumber: z.string().trim().toUpperCase().transform(value => value.replace(/\s+/g, ' ')).pipe(z.string().min(1).max(24).regex(/^[A-Z0-9 -]+$/)),
  fleetNumber: optionalText(32), seatTemplateId: z.uuid(), defaultServiceClassId: z.uuid(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']),
});
export const parseTemplate = (input: unknown): TemplateInput => template.parse(input);
export const parseVehicle = (input: unknown): VehicleInput => vehicle.parse(input);
