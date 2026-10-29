import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({reducedMotion:'reduce'});
 await page.goto(process.env.SEATPAX_TEST_URL||'http://localhost:3001',{waitUntil:'domcontentloaded',timeout:120000});
 const section=page.locator('#persiapan');
 const details=section.locator('details');
 await section.scrollIntoViewIfNeeded();
 assert.equal(await details.count(),3);
 assert.equal(await section.locator('details[open]').count(),1);
 assert.equal(await details.first().getAttribute('open'),'');
 await details.nth(1).locator('summary').click();
 assert.equal(await section.locator('details[open]').count(),1);
 assert.equal(await details.nth(1).getAttribute('open'),'');
 await details.nth(2).locator('summary').focus();
 await page.keyboard.press('Space');
 assert.equal(await section.locator('details[open]').count(),1);
 assert.equal(await details.nth(2).getAttribute('open'),'');
 assert.equal(await section.locator('a').getAttribute('href'),'/tickets');
 for(const width of [320,390,768,1024,1440]) {
  await page.setViewportSize({width,height:1000});
  await section.scrollIntoViewIfNeeded();
  const result=await section.evaluate(el=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(el.querySelector('.lp-experience')).gridTemplateColumns}));
  assert.equal(result.overflow,false,JSON.stringify(result));
  console.log(JSON.stringify(result));
 }
 console.log('Preparation guide: pointer, keyboard, exclusivity, CTA and five viewport checks passed.');
} finally {await browser.close();}
