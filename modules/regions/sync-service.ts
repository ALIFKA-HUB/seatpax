import {fetchRegionDataset, REGION_BASE_URL, RegionImportError} from './provider';
import type {createRegionRepository} from './repository';

export async function syncRegions(options: {apply: boolean; expectedDigest?: string}, repository: ReturnType<typeof createRegionRepository>, fetcher: typeof fetch) {
  let dataset;
  try {
    dataset = await fetchRegionDataset(fetcher);
    if (options.expectedDigest && options.expectedDigest !== dataset.digest) throw new RegionImportError('REVIEWED_DIGEST_CHANGED');
  } catch (error) {
    if (options.apply) await repository.recordFailedImport({code: error instanceof RegionImportError ? error.code : 'FETCH_FAILED', retrievedAt: new Date().toISOString(), sourceUrls: [REGION_BASE_URL]});
    throw error;
  }
  if (options.apply) await repository.promote(dataset);
  return {mode: options.apply ? 'apply' as const : 'dry-run' as const, upstreamDate: dataset.upstreamDate, digest: dataset.digest, provinces: dataset.provinces.length, regencies: dataset.regencies.length};
}
