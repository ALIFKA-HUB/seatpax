import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const f = vi.hoisted(() => ({
  getUser: vi.fn(),
  resolve: vi.fn(),
  listWorkspaces: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  usePathname: () => '/helpdesk',
}));

vi.mock('@/modules/auth/identity', () => ({
  getVerifiedUser: f.getUser,
}));

vi.mock('@/modules/auth/entry-destination', () => ({
  resolveEntryDestination: f.resolve,
  listEntryWorkspaces: f.listWorkspaces,
}));

import AccountRedirectPage from '@/app/account/page';
import HelpdeskShell from '@/app/helpdesk/components/helpdesk-shell';
import WorkspacesPage from '@/app/workspaces/page';

describe('/account removal and direct logout controls', () => {
  beforeEach(() => {
    f.getUser.mockReset();
    f.resolve.mockReset();
    f.listWorkspaces.mockReset();
  });

  it('redirects anonymous /account visitors to /login without rendering UI', async () => {
    f.getUser.mockResolvedValue(null);
    await expect(AccountRedirectPage()).rejects.toThrow('REDIRECT:/login');
  });

  it('redirects verified /account visitors directly to their active role destination', async () => {
    f.getUser.mockResolvedValue({ id: 'admin-user', email: 'admin@example.com' });
    f.resolve.mockResolvedValue('/admin');
    await expect(AccountRedirectPage()).rejects.toThrow('REDIRECT:/admin');
    expect(f.resolve).toHaveBeenCalledWith('admin-user', undefined);
  });

  it('falls back to /trips when entry destination lookup fails', async () => {
    f.getUser.mockResolvedValue({ id: 'cust-user', email: 'cust@example.com' });
    f.resolve.mockRejectedValue(new Error('temporary error'));
    await expect(AccountRedirectPage()).rejects.toThrow('REDIRECT:/trips');
  });

  it('renders direct logout buttons in HelpdeskShell and WorkspacesPage without /account links', async () => {
    f.getUser.mockResolvedValue({ id: 'multi-user', email: 'multi@example.com' });
    f.listWorkspaces.mockResolvedValue([
      { href: '/admin', label: 'Admin PO' },
      { href: '/crew', label: 'Perjalanan Crew' },
    ]);

    const helpdeskHtml = render(h(HelpdeskShell, null, 'Helpdesk body'));
    expect(helpdeskHtml).toContain('Keluar dari akun');
    expect(helpdeskHtml).toContain('<button');
    expect(helpdeskHtml).not.toContain('href="/account"');

    const workspacesHtml = render(await WorkspacesPage());
    expect(workspacesHtml).toContain('Keluar dari akun');
    expect(workspacesHtml).toContain('href="/admin"');
    expect(workspacesHtml).toContain('href="/trips"');
    expect(workspacesHtml).not.toContain('href="/account"');
  });
});
