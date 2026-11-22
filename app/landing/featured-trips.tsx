import Link from 'next/link';
import {Armchair, ArrowRight, Clock} from '@phosphor-icons/react/ssr';

// Presentation fixtures only. These are not trip IDs or bookable inventory.
const demoTrips = [
  {id: 'cianjur-bandung', from: 'Cianjur', to: 'Bandung', departure: '08.00', arrival: '10.00', duration: '2 jam', fare: 65000},
  {id: 'bandung-jakarta', from: 'Bandung', to: 'Jakarta', departure: '09.00', arrival: '12.00', duration: '3 jam', fare: 125000},
  {id: 'bogor-bandung', from: 'Bogor', to: 'Bandung', departure: '10.00', arrival: '13.00', duration: '3 jam', fare: 110000},
];
const rupiah = new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0});

export default function FeaturedTrips() {
  return <section className="lp-network" aria-labelledby="network-title" aria-describedby="network-demo-note">
    <div className="lp-featured-heading">
      <div className="lp-section-title"><h2 id="network-title">Temukan perjalanan Anda</h2><p>Pilihan perjalanan antarkota bersama Seatpax.</p></div>
      <Link className="lp-text-link" href="/trips">Cari perjalanan<span className="lp-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link>
    </div>
    <p className="lp-demo-note" id="network-demo-note"><span>Data demo</span>Contoh tampilan. Rute, jadwal, dan tarif di bawah belum bisa dipesan.</p>
    <ul className="lp-featured-trips" aria-label="Contoh perjalanan">
      {demoTrips.map(trip => <li key={trip.id}>
        <article className="lp-pass-card" aria-labelledby={`${trip.id}-title`}>
          <div className="lp-pass-main">
            <div className="lp-pass-top"><span><Armchair size={18} weight="light" aria-hidden="true"/>Shuttle antarkota</span><span className="lp-pass-badge">Contoh</span></div>
            <h3 id={`${trip.id}-title`}>{trip.from}<ArrowRight size={19} aria-hidden="true"/><span>{trip.to}</span></h3>
            <div className="lp-pass-timeline">
              <div><strong className="sp-numbers">{trip.departure}</strong><span>Berangkat</span></div>
              <div className="lp-pass-connector">
                <span className="lp-pass-duration"><Clock size={14} aria-hidden="true"/><span>{trip.duration}</span></span>
                <span className="lp-pass-track" aria-hidden="true"/>
              </div>
              <div><strong className="sp-numbers">{trip.arrival}</strong><span>Tiba</span></div>
            </div>
          </div>
          <div className="lp-pass-stub">
            <span className="lp-pass-fare-label">Tarif contoh</span>
            <strong className="sp-numbers">{rupiah.format(trip.fare)}</strong>
            <span className="lp-pass-fare-unit">/ penumpang</span>
          </div>
        </article>
      </li>)}
    </ul>
  </section>;
}
