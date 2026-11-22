import type { ReactNode } from 'react';

/**
 * Unified centered empty state used inside Admin PO table cards when a list has zero rows.
 */
export default function AdminEmptyState({
  icon,
  tone = 'blue',
  title,
  description,
  action,
}: {
  icon: ReactNode;
  tone?: 'blue' | 'ok';
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-empty-state">
      <span className={`admin-empty-icon is-${tone}`} aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="admin-empty-actions">{action}</div>}
    </div>
  );
}
