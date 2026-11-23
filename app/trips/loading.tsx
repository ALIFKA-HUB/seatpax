import PassengerShell from '../components/passenger-shell';
import './trips.css';

export default function TripsLoading() {
  return (
    <PassengerShell active="search">
      <div className="tp-page tp-loading" aria-busy="true" aria-label="Memuat jadwal shuttle">
        <header className="tp-head">
          <p className="tp-loading-status" role="status">
            Memuat jadwal perjalanan…
          </p>
          <span className="tp-skeleton-shimmer tp-skeleton-title" aria-hidden="true" />
          <span className="tp-skeleton-shimmer tp-skeleton-subtitle" aria-hidden="true" />
        </header>

        <div className="tp-search-bar tp-skeleton-search" aria-hidden="true">
          <span className="tp-skeleton-shimmer tp-skeleton-input" />
          <span className="tp-skeleton-shimmer tp-skeleton-input" />
          <span className="tp-skeleton-shimmer tp-skeleton-input" />
          <span className="tp-skeleton-shimmer tp-skeleton-submit" />
        </div>

        <div className="tp-skeleton-list" aria-hidden="true">
          <span className="tp-skeleton-shimmer tp-skeleton-card" />
          <span className="tp-skeleton-shimmer tp-skeleton-card" />
          <span className="tp-skeleton-shimmer tp-skeleton-card" />
        </div>
      </div>
    </PassengerShell>
  );
}
