import PassengerShell from '../components/passenger-shell';
import './trips.css';

export default function TripsLoading() {
  return (
    <PassengerShell active="search">
      <div className="tp-workspace tp-loading" aria-busy="true" aria-label="Memuat jadwal shuttle">
        <header className="tp-dash-hero">
          <div className="tp-dash-hero-copy">
            <p className="tp-loading-status" role="status">
              Memuat jadwal perjalanan…
            </p>
            <span className="tp-skeleton-shimmer tp-skeleton-title" aria-hidden="true" />
            <span className="tp-skeleton-shimmer tp-skeleton-subtitle" aria-hidden="true" />
          </div>
          <div className="tp-dash-hero-actions" aria-hidden="true">
            <span className="tp-skeleton-shimmer tp-skeleton-pill" />
            <span className="tp-skeleton-shimmer tp-skeleton-cta" />
          </div>
        </header>

        <div className="tp-kpi-grid" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="tp-kpi-card tp-skeleton-kpi" key={index}>
              <div className="tp-kpi-top">
                <span className="tp-skeleton-shimmer tp-skeleton-icon" />
                <div className="tp-skeleton-kpi-lines">
                  <span className="tp-skeleton-shimmer tp-skeleton-val" />
                  <span className="tp-skeleton-shimmer tp-skeleton-label" />
                </div>
              </div>
              <div className="tp-skeleton-kpi-foot">
                <span className="tp-skeleton-shimmer tp-skeleton-foot-line" />
              </div>
            </div>
          ))}
        </div>

        <section className="tp-card-panel tp-skeleton-panel" aria-hidden="true">
          <div className="tp-skeleton-panel-head">
            <span className="tp-skeleton-shimmer tp-skeleton-head-title" />
            <span className="tp-skeleton-shimmer tp-skeleton-badge" />
          </div>
          <div className="tp-skeleton-search-grid">
            <span className="tp-skeleton-shimmer tp-skeleton-input" />
            <span className="tp-skeleton-shimmer tp-skeleton-input" />
            <span className="tp-skeleton-shimmer tp-skeleton-input" />
            <span className="tp-skeleton-shimmer tp-skeleton-submit" />
          </div>
        </section>

        <div className="tp-dash-bento" aria-hidden="true">
          <div className="tp-primary-col">
            <div className="tp-card-panel tp-skeleton-panel">
              <div className="tp-skeleton-panel-head">
                <span className="tp-skeleton-shimmer tp-skeleton-head-title" />
                <span className="tp-skeleton-shimmer tp-skeleton-head-link" />
              </div>
              <div className="tp-skeleton-rows">
                <span className="tp-skeleton-shimmer tp-skeleton-trip-row" />
                <span className="tp-skeleton-shimmer tp-skeleton-trip-row" />
                <span className="tp-skeleton-shimmer tp-skeleton-trip-row" />
              </div>
            </div>
          </div>

          <aside className="tp-side-col">
            <div className="tp-card-panel tp-skeleton-panel">
              <div className="tp-skeleton-panel-head">
                <span className="tp-skeleton-shimmer tp-skeleton-head-title" />
                <span className="tp-skeleton-shimmer tp-skeleton-badge" />
              </div>
              <span className="tp-skeleton-shimmer tp-skeleton-week-strip" />
              <div className="tp-skeleton-rows">
                <span className="tp-skeleton-shimmer tp-skeleton-side-row" />
                <span className="tp-skeleton-shimmer tp-skeleton-side-row" />
                <span className="tp-skeleton-shimmer tp-skeleton-side-row" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PassengerShell>
  );
}
