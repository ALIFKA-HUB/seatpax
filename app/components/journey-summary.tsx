import {formatDepartureWib, formatIdr} from '../presentation';

export default function JourneySummary({
  fromName,
  toName,
  departureAt,
  seatCode,
  fare,
  operator,
  className,
}: {
  fromName: string;
  toName: string;
  departureAt: string;
  seatCode?: string;
  fare?: string;
  operator?: string;
  className?: string;
}) {
  const tags = [operator, className].filter((item): item is string => Boolean(item));
  return (
    <div className="sp-journey">
      <p className="sp-route">
        {fromName}
        <span aria-hidden="true"> → </span>
        <span className="sp-sr"> menuju </span>
        {toName}
      </p>
      <p className="sp-muted sp-numbers">{formatDepartureWib(departureAt)}</p>
      {tags.length > 0 && (
        <div className="sp-journey-tags">
          {tags.map((tag, index) => (
            <span className="sp-journey-tag" key={`${index}-${tag}`}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="sp-journey-bottom">
        {seatCode && (
          <span className="sp-seat-code">
            Kursi <strong>{seatCode}</strong>
          </span>
        )}
        {fare !== undefined && <strong className="sp-fare sp-numbers">{formatIdr(fare)}</strong>}
      </div>
    </div>
  );
}
