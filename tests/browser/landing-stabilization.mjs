import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const url=process.env.SEATPAX_TEST_URL||'http://localhost:3001';
try {
 for(const mode of ['animated','reduced','no-js']) {
  const context=await browser.newContext({viewport:{width:1440,height:900},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'networkidle',timeout:120000});
  const root=page.locator('#alur-pemesanan .lpm-root');
  await root.scrollIntoViewIfNeeded();
  if(mode!=='no-js')await page.waitForFunction(()=>document.querySelector('#alur-pemesanan .lpm-root')?.dataset.motionReady==='true');
  // Sample the complete deck cycle; ready-state JS uses an 12-second timeline.
  for(const time of [0,2000,4500,7500,10000,11990]) {
   if(mode==='animated')await page.evaluate(t=>document.querySelector('#alur-pemesanan .lpm-root').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=t;}),time);
   const bounds=await root.evaluate(el=>{const f=el.querySelector('.lpm-field').getBoundingClientRect();return [...el.querySelectorAll('.lpm-card')].filter(c=>getComputedStyle(c).display!=='none').map(c=>{const r=c.getBoundingClientRect();return {top:r.top-f.top,bottom:r.bottom-f.bottom,left:r.left-f.left,right:r.right-f.right};});});
   for(const b of bounds)assert.ok(b.top>=-1&&b.bottom<=1&&b.left>=-1&&b.right<=1,`${mode} ${time}: ${JSON.stringify(b)}`);
  }
  if(mode==='no-js') {
   // Reproduce the original 620px desktop column independently of the outer grid.
   await root.evaluate(el=>el.style.width='620px');
   const spill=await root.evaluate(el=>{const f=el.querySelector('.lpm-field').getBoundingClientRect();return Math.max(...[...el.querySelectorAll('.lpm-card')].map(c=>c.getBoundingClientRect().bottom-f.bottom));});
   assert.ok(spill<=1,`620px static deck spills ${spill}px`);
   await root.evaluate(el=>el.style.removeProperty('width'));
   await page.setViewportSize({width:390,height:844});
   const mobileSpill=await root.evaluate(el=>{const f=el.querySelector('.lpm-field').getBoundingClientRect();return Math.max(...[...el.querySelectorAll('.lpm-card')].filter(c=>getComputedStyle(c).display!=='none').map(c=>c.getBoundingClientRect().bottom-f.bottom));});
   assert.ok(mobileSpill<=1,`390px static deck spills ${mobileSpill}px`);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No-JS mobile overflow');
  }
  await context.close();
  console.log(`${mode}: deck stays inside its field`);
 }
 const page=await browser.newPage({reducedMotion:'reduce'});
 await page.goto(url,{waitUntil:'networkidle',timeout:120000});
 for(const width of [320,390,768,1024,1440]) {
  await page.setViewportSize({width,height:844});
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);
 }
 await page.setViewportSize({width:1440,height:900});
 const grid=await page.evaluate(()=>['.sp-header','.lp-hero','.sp-site-footer'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right};}));
 grid.forEach(r=>assert.ok(Math.abs(r.left-grid[0].left)<2&&Math.abs(r.right-grid[0].right)<2,JSON.stringify(grid)));
 const gap=await page.evaluate(()=>{const a=document.querySelector('#alur-pemesanan>section').getBoundingClientRect();const b=document.querySelector('#bantuan>section').getBoundingClientRect();return b.top-a.bottom;});
 assert.ok(gap<250,`Oversized section gap ${gap}`);
 await page.setViewportSize({width:390,height:844});
 await page.locator('.lp-search-fields .lp-button').scrollIntoViewIfNeeded();
 const overlap=await page.evaluate(()=>{const a=document.querySelector('.sp-complaint-entry-landing').getBoundingClientRect();return ['.lp-search-fields .lp-button','.lp-search-note'].some(s=>{const b=document.querySelector(s)?.getBoundingClientRect();return b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});});
 assert.equal(overlap,false,'Complaint entry overlaps search action/status');
 console.log('Five viewport, alignment, section gap and mobile FAB checks passed.');
} finally {await browser.close();}
