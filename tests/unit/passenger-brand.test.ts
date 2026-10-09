import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Brand from '@/app/components/brand';
it('renders named brand links with intrinsic dimensions and the matching raster',()=>{
 for(const compact of [false,true]){
  const html=renderToStaticMarkup(createElement(Brand,{compact}));
  expect(html).toContain('href="/"');expect(html).toContain('aria-label="Seatpax"');
  expect(html).toContain(compact?'seatpax-icon.png':'seatpax-horizontal.png');
  expect(html).toMatch(/width="[1-9][0-9]*"/);expect(html).toMatch(/height="[1-9][0-9]*"/);
  expect(html).toContain('alt=""');
 }
});
