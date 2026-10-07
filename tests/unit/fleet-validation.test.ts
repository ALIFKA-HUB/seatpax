import { describe, expect, it } from 'vitest';
import { parseTemplate, parseVehicle } from '../../modules/fleet/validation';

const template = () => ({ name: ' Demo ', rows: 1, cols: 6, cells: ['SEAT', 'DRIVER', 'AISLE', 'DOOR', 'EMPTY', 'FACILITY'].map((type, colIndex) => ({ rowIndex: 0, colIndex, type, seatCode: type === 'SEAT' ? ' a1 ' : null, label: ' ' })) });
describe('fleet validation', () => {
  it('normalizes the complete six-type grid', () => {
    const result = parseTemplate(template());
    expect(result.name).toBe('Demo');
    expect(result.cells[0].seatCode).toBe('A1');
    expect(result.cells.every(c => c.label === null)).toBe(true);
  });
  it('accepts the maximum complete grid', () => {
    expect(parseTemplate({ name: 'Max', rows: 30, cols: 8, cells: Array.from({ length: 240 }, (_, i) => ({ rowIndex: Math.floor(i / 8), colIndex: i % 8, type: 'SEAT', seatCode: String(i + 1), label: null })) }).cells).toHaveLength(240);
  });
  it.each(['missing', 'duplicate', 'outside', 'no-seat', 'non-seat-code', 'long-label', 'long-code', 'bad-code', 'rows', 'cols', 'duplicate-code'])('rejects %s', mutation => {
    const input = template();
    if (mutation === 'missing') input.cells.pop();
    if (mutation === 'duplicate') input.cells[1].colIndex = 0;
    if (mutation === 'outside') input.cells[1].rowIndex = 1;
    if (mutation === 'no-seat') input.cells[0] = { ...input.cells[0], type: 'EMPTY', seatCode: null };
    if (mutation === 'non-seat-code') input.cells[1].seatCode = 'A2';
    if (mutation === 'long-label') input.cells[0].label = 'X'.repeat(41);
    if (mutation === 'long-code') input.cells[0].seatCode = 'X'.repeat(9);
    if (mutation === 'bad-code') input.cells[0].seatCode = 'Å';
    if (mutation === 'rows') input.rows = 31;
    if (mutation === 'cols') input.cols = 9;
    if (mutation === 'duplicate-code') input.cells[1] = { ...input.cells[1], type: 'SEAT', seatCode: 'A1' };
    expect(() => parseTemplate(input)).toThrow();
  });
  it('normalizes plate and optional fleet number, rejects invalid plate', () => {
    const input = { name: ' Bus ', plateNumber: ' b  1234 ab ', fleetNumber: ' ', seatTemplateId: '00000000-0000-4000-8000-000000000001', defaultServiceClassId: '00000000-0000-4000-8000-000000000002', status: 'ACTIVE' };
    expect(parseVehicle(input)).toMatchObject({ name: 'Bus', plateNumber: 'B 1234 AB', fleetNumber: null });
    expect(() => parseVehicle({ ...input, plateNumber: 'B/123' })).toThrow();
  });
});
