import { redirect } from 'next/navigation';
import { getVerifiedUser } from '@/modules/auth/identity';
import { resolveEntryDestination } from '@/modules/auth/entry-destination';

export const dynamic = 'force-dynamic';

/** Removes the standalone /account UI and routes visitors directly to their active destination. */
export default async function AccountRedirectPage() {
  const user = await getVerifiedUser();
  if (!user) redirect('/login');

  let destination = '/trips';
  try {
    destination = await resolveEntryDestination(user.id, undefined);
  } catch {
    destination = '/trips';
  }
  redirect(destination);
}
