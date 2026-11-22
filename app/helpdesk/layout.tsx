import type { ReactNode } from 'react';
import { getVerifiedUser } from '@/modules/auth/identity';
import { helpdeskConfig } from '@/lib/env/helpdesk';
import { getDatabase } from '@/lib/db';
import '../admin/admin.css';
import '../admin/admin-refresh.css';
import './helpdesk.css';
import '../styles/ops-dark.css';
import HelpdeskShell from './components/helpdesk-shell';

export const metadata = { title: 'Helpdesk | Seatpax', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function HelpdeskLayout({ children }: { children: ReactNode }) {
  let pendingCount: number | undefined;
  try {
    const user = await getVerifiedUser();
    if (user) {
      const config = helpdeskConfig();
      const [row] = await getDatabase().$client`
        select count(*)::int as count
        from public.helpdesk_cases c
        where c.company_id = ${config.companyId}
          and c.status <> 'SELESAI'
          and exists (
            select 1 from public.memberships m
            where m.user_id = ${user.id}
              and m.company_id = ${config.companyId}
              and m.role::text in ('HELPDESK', 'ADMIN_PO')
              and m.status = 'ACTIVE'
          )
      `;
      if (row) pendingCount = Number(row.count);
    }
  } catch {}

  return <HelpdeskShell pendingCount={pendingCount}>{children}</HelpdeskShell>;
}
