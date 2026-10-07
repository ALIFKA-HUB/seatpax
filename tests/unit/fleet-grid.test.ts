import { describe, expect, it } from 'vitest';
import { capacity, emptyGrid, projectLayout, renumber, resize, setCell } from '../../modules/fleet/grid';

describe('fleet grid', () => {
  it('creates complete empty coordinates without shared cells', () => {
    const grid = emptyGrid(2, 3);
    expect(grid.cells).toHaveLength(6);
    expect(grid.cells[5]).toEqual({ rowIndex: 1, colIndex: 2, type: 'EMPTY', label: null, seatCode: null });
    expect(() => emptyGrid(31, 2)).toThrow();
    expect(() => emptyGrid(2, 9)).toThrow();
  });
  it('suggests unused codes, clears codes and preserves the original', () => {
    const original = emptyGrid(1, 3);
    const first = setCell(original, 0, 0, 'SEAT');
    const second = setCell(first, 0, 1, 'SEAT');
    expect(second.cells.map(c => c.seatCode)).toEqual(['01', '02', null]);
    expect(original.cells[0].type).toBe('EMPTY');
    expect(setCell(second, 0, 0, 'DRIVER').cells[0].seatCode).toBeNull();
    expect(capacity(second)).toBe(2);
  });
  it('renumbers row major regardless of input order and retains 100', () => {
    const grid = emptyGrid(30, 8);
    grid.cells = grid.cells.slice(0).reverse().map(c => ({ ...c, type: 'SEAT', seatCode: 'X' }));
    const numbered = renumber(grid);
    expect(numbered.cells.find(c => c.rowIndex === 0 && c.colIndex === 0)?.seatCode).toBe('01');
    expect(numbered.cells.find(c => c.rowIndex === 12 && c.colIndex === 3)?.seatCode).toBe('100');
    expect(grid.cells[0].seatCode).toBe('X');
  });
  it('resizes overlap and reports discarded content without modifying draft', () => {
    const grid = setCell(emptyGrid(2, 2), 1, 1, 'DOOR', 'Exit');
    expect(resize(grid, 1, 1).removesContent).toBe(true);
    expect(grid.cells).toHaveLength(4);
    expect(resize(emptyGrid(2, 2), 1, 1).removesContent).toBe(false);
    expect(resize(grid, 3, 3).layout.cells.find(c => c.rowIndex === 1 && c.colIndex === 1)?.label).toBe('Exit');
  });
  it('projects every cell independently', () => {
    const input = { ...setCell(emptyGrid(1, 2), 0, 0, 'SEAT', 'Front', 'A1'), name: 'Bus' };
    const projection = projectLayout(input);
    expect(projection).toEqual({ rows: 1, cols: 2, cells: input.cells });
    projection.cells[0].label = 'Changed';
    expect(input.cells[0].label).toBe('Front');
  });
});
