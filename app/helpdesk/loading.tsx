export default function HelpdeskLoading() {
  return (
    <div className="dash-root hd-loading" aria-busy="true" aria-label="Memuat data Helpdesk">
      <div className="dash-hero">
        <div className="dash-hero-copy">
          <p className="hd-loading-status" role="status">
            Memuat data Helpdesk…
          </p>
          <span className="hd-skeleton-shimmer hd-skeleton-title" aria-hidden="true" />
          <span className="hd-skeleton-shimmer hd-skeleton-subtitle" aria-hidden="true" />
        </div>
        <div className="dash-hero-actions" aria-hidden="true">
          <span className="hd-skeleton-shimmer hd-skeleton-pill" />
          <span className="hd-skeleton-shimmer hd-skeleton-cta" />
        </div>
      </div>

      <div className="dash-kpi-grid hd-kpi-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="dash-card dash-kpi-card hd-skeleton-kpi" key={index}>
            <div className="dash-kpi-top">
              <span className="hd-skeleton-shimmer hd-skeleton-icon" />
              <div className="hd-skeleton-kpi-lines">
                <span className="hd-skeleton-shimmer hd-skeleton-val" />
                <span className="hd-skeleton-shimmer hd-skeleton-label" />
              </div>
            </div>
            <div className="hd-skeleton-kpi-foot">
              <span className="hd-skeleton-shimmer hd-skeleton-foot-line" />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-bento" aria-hidden="true">
        <div className="dash-primary-col">
          <div className="dash-card hd-skeleton-panel">
            <div className="hd-skeleton-panel-head">
              <span className="hd-skeleton-shimmer hd-skeleton-head-title" />
              <span className="hd-skeleton-shimmer hd-skeleton-head-link" />
            </div>
            <div className="hd-skeleton-rows">
              <span className="hd-skeleton-shimmer hd-skeleton-row" />
              <span className="hd-skeleton-shimmer hd-skeleton-row" />
              <span className="hd-skeleton-shimmer hd-skeleton-row" />
            </div>
          </div>
          <div className="dash-card hd-skeleton-panel">
            <div className="hd-skeleton-panel-head">
              <span className="hd-skeleton-shimmer hd-skeleton-head-title" />
              <span className="hd-skeleton-shimmer hd-skeleton-head-link" />
            </div>
            <div className="hd-skeleton-rows">
              <span className="hd-skeleton-shimmer hd-skeleton-row" />
              <span className="hd-skeleton-shimmer hd-skeleton-row" />
              <span className="hd-skeleton-shimmer hd-skeleton-row" />
            </div>
          </div>
        </div>
        <div className="dash-side-col">
          <div className="dash-card hd-skeleton-panel hd-skeleton-side">
            <div className="hd-skeleton-panel-head">
              <span className="hd-skeleton-shimmer hd-skeleton-head-title" />
              <span className="hd-skeleton-shimmer hd-skeleton-badge" />
            </div>
            <div className="hd-skeleton-rows">
              <span className="hd-skeleton-shimmer hd-skeleton-timeline-item" />
              <span className="hd-skeleton-shimmer hd-skeleton-timeline-item" />
              <span className="hd-skeleton-shimmer hd-skeleton-timeline-item" />
              <span className="hd-skeleton-shimmer hd-skeleton-timeline-item" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
