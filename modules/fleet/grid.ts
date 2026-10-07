import type { CellType, Layout, TemplateInput } from './types';

function dimensions(rows: number, cols: number) {
  if (!Number.isInteger(rows) || rows < 1 || rows > 30 || !Number.isInteger(cols) || cols < 1 || cols > 8) throw new Error('Ukuran grid tidak valid.');
}
export function emptyGrid(rows: number, cols: number): Layout {
  dimensions(rows, cols);
  return { rows, cols, cells: Array.from({ length: rows * cols }, (_, index) => ({ rowIndex: Math.floor(index / cols), colIndex: index % cols, type: 'EMPTY', label: null, seatCode: null })) };
}
export const capacity = (layout: Layout) => layout.cells.filter(cell => cell.type === 'SEAT').length;
export const projectLayout = (input: TemplateInput): Layout => ({ rows: input.rows, cols: input.cols, cells: input.cells.map(cell => ({ ...cell })) });
export function renumber(layout: Layout): Layout {
  let number = 0;
  return { ...layout, cells: layout.cells.map(cell => ({ ...cell })).sort((a, b) => a.rowIndex - b.rowIndex || a.colIndex - b.colIndex).map(cell => ({ ...cell, seatCode: cell.type === 'SEAT' ? String(++number).padStart(2, '0') : null })) };
}
export function resize(layout: Layout, rows: number, cols: number): { layout: Layout; removesContent: boolean } {
  const next = emptyGrid(rows, cols);
  const byCoordinate = new Map(layout.cells.map(cell => [`${cell.rowIndex}:${cell.colIndex}`, cell]));
  next.cells = next.cells.map(cell => ({ ...(byCoordinate.get(`${cell.rowIndex}:${cell.colIndex}`) ?? cell) }));
  return { layout: next, removesContent: layout.cells.some(cell => (cell.rowIndex >= rows || cell.colIndex >= cols) && cell.type !== 'EMPTY') };
}
export function setCell(layout: Layout, row: number, col: number, type: CellType, label?: string | null, seatCode?: string | null): Layout {
  const current = layout.cells.find(cell => cell.rowIndex === row && cell.colIndex === col);
  if (!current) throw new Error('Sel tidak ditemukan.');
  const used = new Set(layout.cells.filter(cell => cell !== current && cell.type === 'SEAT').map(cell => cell.seatCode));
  let number = 1;
  while (used.has(String(number).padStart(2, '0'))) number++;
  const code = type === 'SEAT' ? (seatCode === undefined ? current.seatCode ?? String(number).padStart(2, '0') : seatCode) : null;
  return { ...layout, cells: layout.cells.map(cell => cell === current ? { ...cell, type, label: label === undefined ? cell.label : label, seatCode: code } : { ...cell }) };
}
