import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const css=readFileSync('app/crew/crew.css','utf8');
it('isolates selectors and retains focus and narrow layout boundaries',()=>{
 const selectors=css.match(/[^{}]+(?=\{)/g)??[];
 for(const selector of selectors)if(!selector.trim().startsWith('@'))expect(selector).toContain('.crew-shell');
 expect(css).toContain(':focus-visible');
 expect(css).toMatch(/\.seat-grid-region[^{}]*\{[^}]*overflow-x:auto/);
 expect(css).toContain('overflow-wrap:anywhere');expect(css).toContain('minmax(0,1fr)');
});
it('overrides global operational control sizing within Crew scope',()=>{
 expect(css).toContain('.crew-shell .manifest-controls input');
 expect(css).toContain('.crew-shell .boarding-form select');
 expect(css).toContain('min-height:48px');
});
it('restricts optional interaction motion to no-preference',()=>{
 expect(css).toContain('@media (prefers-reduced-motion:no-preference)');
});
