'use client';
import type { Layout } from '@/modules/fleet/types';
export default function SeatGrid({ layout, selected, onSelect }: { layout: Layout; selected?: string; onSelect?: (row: number, col: number) => void }) {
  return <div className="seat-grid-region" role="region" aria-label="Denah kursi" tabIndex={0}><p className="seat-front">DEPAN KENDARAAN</p><div className="seat-grid" style={{ gridTemplateColumns: `repeat(${layout.cols}, 60px)` }}>{[...layout.cells].sort((a, b) => a.rowIndex - b.rowIndex || a.colIndex - b.colIndex).map(cell => {
    const key = `${cell.rowIndex}:${cell.colIndex}`, label = `Baris ${cell.rowIndex + 1}, kolom ${cell.colIndex + 1}, ${cell.type}${cell.seatCode ? ', ' + cell.seatCode : ''}${cell.label ? ', ' + cell.label : ''}`;
    return <button type="button" key={key} className={'seat-cell seat-' + cell.type.toLowerCase()} aria-label={label} aria-pressed={onSelect ? selected === key : undefined} onClick={() => onSelect?.(cell.rowIndex, cell.colIndex)} disabled={!onSelect}><strong>{cell.seatCode ?? ({ DRIVER: 'Sopir', AISLE: 'Lorong', DOOR: 'Pintu', FACILITY: 'Fasilitas', EMPTY: '—', SEAT: '?' })[cell.type]}</strong></button>;
  })}</div></div>;
}
