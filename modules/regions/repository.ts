import type {Sql} from 'postgres';
import type {RegionDataset, RegionOptions} from './types';
import {RegionImportError} from './provider';

export function createRegionRepository(client: Sql) {
  return {
    async readOptions(): Promise<RegionOptions> {
      // A single statement sees one committed version of all three tables.
      const rows = await client`select
        coalesce((select json_agg(p order by p.name,p.code) from
          (select id,code,name from public.region_provinces where provider='emsifa-v2' and active) p),'[]') as provinces,
        coalesce((select json_agg(r order by r.name,r.code) from
          (select r.id,r.code,r.name,r.province_id as "provinceId" from public.region_regencies r
           join public.region_provinces p on p.id=r.province_id and p.provider=r.provider
           where r.provider='emsifa-v2' and r.active and p.active) r),'[]') as regencies,
        (select upstream_date::text from public.region_import_runs where provider='emsifa-v2' and state='SUCCEEDED'
         order by upstream_date desc,finished_at desc limit 1) as "upstreamDate"`;
      return rows[0] as RegionOptions;
    },
    async promote(dataset: RegionDataset): Promise<{runId: string; provinces: number; regencies: number}> {
      const attempts = await client`insert into public.region_import_runs(provider,state,source_urls,upstream_date,retrieved_at,digest)
        values(${dataset.provider},'FETCHING',${dataset.sourceUrls},${dataset.upstreamDate},${dataset.retrievedAt},${dataset.digest}) returning id`;
      const runId = attempts[0].id as string;
      try {
        await client.begin(async tx => {
          await tx`set local lock_timeout='15s'`;
          await tx`set local statement_timeout='60s'`;
          await tx`select pg_advisory_xact_lock(hashtextextended(${dataset.provider},0))`;
          const previous = await tx`select upstream_date::text as date,digest from public.region_import_runs
            where provider=${dataset.provider} and state='SUCCEEDED' order by upstream_date desc,finished_at desc limit 1`;
          if (previous[0] && previous[0].date > dataset.upstreamDate) throw new RegionImportError('OLDER_DATASET');
          if (previous[0]?.date === dataset.upstreamDate && previous[0].digest !== dataset.digest) throw new RegionImportError('VERSION_CONFLICT');
          for (const p of dataset.provinces) await tx`insert into public.region_provinces(provider,code,name,active,last_seen_run_id)
            values(${dataset.provider},${p.code},${p.name},true,${runId}) on conflict(provider,code)
            do update set name=excluded.name,active=true,last_seen_run_id=excluded.last_seen_run_id`;
          for (const r of dataset.regencies) await tx`insert into public.region_regencies(provider,code,name,province_id,active,last_seen_run_id)
            select ${dataset.provider},${r.code},${r.name},id,true,${runId} from public.region_provinces where provider=${dataset.provider} and code=${r.provinceCode}
            on conflict(provider,code) do update set name=excluded.name,province_id=excluded.province_id,active=true,last_seen_run_id=excluded.last_seen_run_id`;
          await tx`update public.region_regencies set active=false where provider=${dataset.provider} and last_seen_run_id<>${runId}`;
          await tx`update public.region_provinces set active=false where provider=${dataset.provider} and last_seen_run_id<>${runId}`;
          await tx`update public.region_import_runs set state='SUCCEEDED',province_count=${dataset.provinces.length},regency_count=${dataset.regencies.length},finished_at=clock_timestamp() where id=${runId}`;
        });
      } catch (error) {
        await client`update public.region_import_runs set state='FAILED',failure_code=${error instanceof RegionImportError ? error.code : 'PROMOTION_FAILED'},finished_at=clock_timestamp() where id=${runId}`;
        throw error;
      }
      return {runId, provinces: dataset.provinces.length, regencies: dataset.regencies.length};
    },
    async recordFailedImport(input: {code: string; retrievedAt: string; sourceUrls: string[]}) {
      await client`insert into public.region_import_runs(provider,state,source_urls,retrieved_at,finished_at,failure_code)
        values('emsifa-v2','FAILED',${input.sourceUrls},${input.retrievedAt},clock_timestamp(),${input.code})`;
    },
  };
}
