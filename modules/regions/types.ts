export type RegionDataset = {
  provider: 'emsifa-v2'; upstreamDate: string; retrievedAt: string; digest: string; sourceUrls: string[];
  provinces: {code: string; name: string}[];
  regencies: {code: string; name: string; provinceCode: string}[];
};
export type RegionOptions = {
  provinces: {id: string; code: string; name: string}[];
  regencies: {id: string; code: string; name: string; provinceId: string}[];
  upstreamDate: string | null;
};
export const emptyRegionOptions: RegionOptions = {provinces: [], regencies: [], upstreamDate: null};
