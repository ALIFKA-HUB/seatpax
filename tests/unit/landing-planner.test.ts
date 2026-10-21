import {beforeEach, expect, it, vi} from 'vitest';
import {renderToStaticMarkup as render} from 'react-dom/server';
import JourneyPlanner, {PlannerSkeleton} from '@/app/landing/journey-planner';

const {locations} = vi.hoisted(()=>({locations:vi.fn()}));
vi.mock('@/app/trips/data',()=>({passengerServices:()=>({availability:{locations}})}));
beforeEach(()=>{locations.mockReset();});

it('keeps showcase empty while actual locations remain searchable',async()=>{
 locations.mockResolvedValue([{id:'point-a',name:'Point <A>',city:'City A'},{id:'point-b',name:'Point B',city:'City B'}]);
 const html=render(await JourneyPlanner());
 expect(html).toContain('action="/trips"');
 for(const name of ['from','to','date'])expect(html).toContain(`name="${name}"`);
 expect(html).toContain('value="point-a"');
 expect(html).toContain('Point &lt;A&gt;');
 const showcase=html.slice(html.indexOf('class="lp-network"'));
 expect(showcase).toContain('Daftar perjalanan belum ditampilkan.');
 expect(showcase).not.toContain('Point &lt;A&gt;');
 expect(showcase).not.toContain('City A');
 expect(showcase).not.toContain('Rp');
 expect(showcase).not.toContain('lp-point');
});

it('explains an empty location source without inventing routes',async()=>{
 locations.mockResolvedValue([]);
 const html=render(await JourneyPlanner());
 expect(html).toContain('Belum ada titik dengan jadwal yang dibuka.');
 expect(html).toContain('Daftar perjalanan belum ditampilkan.');
});

it('offers recovery on location failure and keeps the showcase independent',async()=>{
 locations.mockRejectedValue(new Error('test source unavailable'));
 const html=render(await JourneyPlanner());
 expect(html).toContain('role="status"');
 expect(html).toContain('Titik keberangkatan belum dapat dimuat.');
 expect(html).toContain('Muat ulang');
 expect(html).toContain('Daftar perjalanan belum ditampilkan.');
});

it('keeps a structural search fallback and the same empty showcase',()=>{
 const html=render(PlannerSkeleton());
 expect(html).toContain('aria-busy="true"');
 expect(html).toContain('lp-search-skeleton');
 expect(html).toContain('Daftar perjalanan belum ditampilkan.');
});
