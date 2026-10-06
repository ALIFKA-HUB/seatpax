export async function checkDatabase(connection: {
  query: () => Promise<unknown>;
  close: () => Promise<void>;
}): Promise<{ ok: boolean }> {
  let ok = false;
  try {
    await connection.query();
    ok = true;
  } catch {
    ok = false;
  } finally {
    try { await connection.close(); }
    catch { ok = false; }
  }
  return { ok };
}
