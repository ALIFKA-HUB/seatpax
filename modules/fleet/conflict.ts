export function resolveConflict<T extends { version?: number; revision?: number }>(draft: T, latest: T, choice: 'adopt' | 'overwrite', overwriteConfirmed: boolean): T {
  if (choice === 'adopt') return structuredClone(latest);
  if (!overwriteConfirmed) throw new Error('Konfirmasi penggantian data terbaru diperlukan.');
  return { ...structuredClone(draft), ...(latest.version !== undefined ? { version: latest.version } : { revision: latest.revision }) };
}
