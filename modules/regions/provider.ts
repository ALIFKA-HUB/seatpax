import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {RegionDataset} from './types';

export const REGION_BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/v2';
const label = z.string().trim().min(1).max(200);
const meta = z.object({updated_at: z.iso.date(), level: z.number().int()});
const province = z.object({id: z.string().regex(/^\d{2}$/), name: label});
const regency = z.object({id: z.string().regex(/^\d{2}\.\d{2}$/), name: label});

export class RegionImportError extends Error {
  constructor(public readonly code: string) {super(code);}
}

export async function fetchRegionDataset(fetcher: typeof fetch): Promise<RegionDataset> {
  const retrievedAt = new Date().toISOString();
  const sourceUrls: string[] = [];
  async function read(path: string): Promise<unknown> {
    const url = `${REGION_BASE_URL}/${path}`;
    sourceUrls.push(url);
    try {
      const response = await fetcher(url, {signal: AbortSignal.timeout(15_000), cache: 'no-store'});
      if (!response.ok) throw new Error('http');
      return await response.json();
    } catch {throw new RegionImportError('UPSTREAM_UNAVAILABLE');}
  }
  try {
    const stats = z.object({data: z.object({total_provinces: z.number().int().positive(), total_regencies: z.number().int().positive()}), meta}).parse(await read('stats.json'));
    const root = z.object({data: z.array(province).min(1), meta}).parse(await read('provinces.json'));
    if (root.meta.level !== 1 || stats.meta.level !== 0 || root.meta.updated_at !== stats.meta.updated_at) throw new RegionImportError('UPSTREAM_VERSION_MISMATCH');
    const provinces = root.data.map(p => ({code: p.id, name: p.name})).sort((a,b) => a.code.localeCompare(b.code));
    if (provinces.length !== stats.data.total_provinces || new Set(provinces.map(p => p.code)).size !== provinces.length) throw new RegionImportError('INVALID_PROVINCES');
    const regencies: RegionDataset['regencies'] = [];
    // Four workers bound concurrency without a dependency or a partial promotion.
    let next = 0;
    await Promise.all(Array.from({length: Math.min(4, provinces.length)}, async () => {
      while (next < provinces.length) {
        const parent = provinces[next++];
        const page = z.object({data: z.array(regency).min(1), meta}).parse(await read(`regencies/${parent.code}.json`));
        if (page.meta.level !== 2 || page.meta.updated_at !== root.meta.updated_at) throw new RegionImportError('UPSTREAM_VERSION_MISMATCH');
        for (const item of page.data) {
          if (!item.id.startsWith(`${parent.code}.`)) throw new RegionImportError('INVALID_PARENT');
          regencies.push({code: item.id, name: item.name, provinceCode: parent.code});
        }
      }
    }));
    regencies.sort((a,b) => a.code.localeCompare(b.code));
    if (regencies.length !== stats.data.total_regencies || new Set(regencies.map(r => r.code)).size !== regencies.length) throw new RegionImportError('INVALID_REGENCIES');
    const content = {provider: 'emsifa-v2' as const, upstreamDate: root.meta.updated_at, provinces, regencies};
    return {...content, retrievedAt, sourceUrls: sourceUrls.sort(), digest: createHash('sha256').update(JSON.stringify(content)).digest('hex')};
  } catch (error) {
    if (error instanceof RegionImportError) throw error;
    throw new RegionImportError('INVALID_UPSTREAM_DATA');
  }
}
