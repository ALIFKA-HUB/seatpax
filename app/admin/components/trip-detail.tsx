import type {TripDetail as Detail} from '@/modules/trip/types';
import SeatGrid from './seat-grid';
import {formatDepartureWib,formatIdr} from '@/app/presentation';
export default function TripDetail({detail,preview=false}:{detail:Detail;preview?:boolean}) {
 const identity=detail.trip.identity;
 return <>
  <div className="trip-summary"><h2>{identity?.routeName??detail.trip.name}</h2><p>{identity?.vehicleName??'Armada belum tersedia'} · {identity?.plateNumber??'—'} · {identity?.className??'Kelas belum tersedia'}</p><p>Keberangkatan: {formatDepartureWib(detail.trip.departureAt)}</p><p>{detail.seats.length} kursi · {detail.segments.length} segmen</p></div>
  <p className="admin-hint">{preview?'Preview draft tersimpan':'Data perjalanan terkunci saat publikasi. Perubahan template sumber berlaku untuk perjalanan berikutnya.'}</p>
  <div className="admin-table-wrap" role="region" aria-label="Jadwal stop perjalanan" tabIndex={0}><table><thead><tr><th>Stop</th><th>Tiba (WIB)</th><th>Berangkat (WIB)</th></tr></thead><tbody>{detail.stops.map(s=><tr key={s.sequence}><td>{s.sequence}. {s.name}<br/><small>{s.city}{s.address?' · '+s.address:''}</small></td><td>{formatDepartureWib(s.arrivalAt)}</td><td>{formatDepartureWib(s.departureAt)}</td></tr>)}</tbody></table></div>
  <details className="trip-details"><summary>Rincian perjalanan</summary><h3>Tarif per segmen</h3><ul>{detail.segments.map(s=><li key={s.sequence}>{detail.stops[s.fromSequence-1]?.name} → {detail.stops[s.toSequence-1]?.name}: {formatIdr(s.price)}</li>)}</ul><h3>Denah kursi</h3>{detail.layout?<SeatGrid layout={detail.layout}/>:<p>Denah belum tersedia.</p>}{!preview&&<p className="admin-hint">Jumlah anchor teknis: {detail.inventoryCount}. Ini jumlah unit inventori dalam snapshot, bukan jumlah kursi yang tersedia untuk dijual.</p>}</details>
 </>;
}