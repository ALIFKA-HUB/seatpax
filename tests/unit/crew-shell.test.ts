import {it,expect} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';

it('renders Crew navigation and a skip destination',async()=>{
 const {default:CrewShell}=await import('@/app/crew/components/crew-shell');
 const html=render(h(CrewShell,{children:'Crew content'}));
 for(const value of ['aria-label="Seatpax"','href="/crew"','href="/account"','href="#crew-main"','id="crew-main"','Crew content'])expect(html).toContain(value);
});
it('isolates Crew layout from Admin CSS',()=>{
 const layout=readFileSync('app/crew/layout.tsx','utf8');
 expect(layout).toContain('await crewData()');
 expect(layout).not.toContain('../admin/admin.css');
});
