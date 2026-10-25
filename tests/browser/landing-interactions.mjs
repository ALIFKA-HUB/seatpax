import assert from 'node:assert/strict';
// Run against a running dev server; use PLAYWRIGHT_MODULE for a host-provided installation.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const failures=[];
const check=(name,fn)=>{try{fn();console.log('PASS',name)}catch(e){failures.push(name+': '+e.message);console.log('FAIL',name)}};
try {
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await page.goto(process.env.SEATPAX_TEST_URL || 'http://localhost:3001',{waitUntil:'domcontentloaded'});
 await page.locator('.lpm-root[data-kind=deck][data-motion-ready=true]').waitFor();
 const text=await page.locator('.sp-complaint-entry').textContent();
 check('icon-only complaint entry',()=>assert.equal(text,''));
 const captions=await page.locator('.lpm-caption').count();
 check('no external illustration controls',()=>assert.equal(captions,0));
 await page.locator('.lp-section-nav-wide a[href="#cara-memesan"]').click();
 const states=[];
 for(let i=0;i<30;i++){states.push(await page.locator('.lp-section-nav-wide [aria-current]').textContent());await page.waitForTimeout(60);}
 check('clicked section remains active during smooth scroll',()=>assert.ok(states.every(s=>s==='Cara pesan'),states.join(',')));
 for(const [id,label] of [['persiapan','Persiapan'],['alur-pemesanan','Pemesanan'],['bantuan','Bantuan']]) {
   await page.locator(`.lp-section-nav-wide a[href="#${id}"]`).click();
   await page.waitForTimeout(1600);
   const current=await page.locator('.lp-section-nav-wide [aria-current]').textContent();
   check(`navigation settles on ${label}`,()=>assert.equal(current,label));
 }
 await page.locator('.lpm-deck-field').scrollIntoViewIfNeeded();
 await page.waitForTimeout(2500);
 const running=await page.locator('.lpm-card-seat').evaluate(e=>e.getAnimations().some(a=>a.playState==='running'));
 check('deck starts automatically',()=>assert.ok(running));
 await page.locator('.lpm-card-hit').first().evaluate(e=>e.click());
 const rate=await page.locator('.lpm-card-seat').evaluate(e=>e.getAnimations()[0].playbackRate);
 check('card click speeds up current loop',()=>assert.equal(rate,2.5));
 await page.waitForTimeout(1800);
 const desktop=await page.locator('.lpm-deck-field').evaluate(e=>({height:e.getBoundingClientRect().height,ys:[...e.querySelectorAll('.lpm-card')].map(c=>c.getBoundingClientRect().y)}));
 check('desktop never spreads vertically',()=>assert.ok(desktop.height<450&&Math.max(...desktop.ys)-Math.min(...desktop.ys)<100,JSON.stringify(desktop)));

 await page.mouse.move(0,0);
 const spread=await page.locator('.lpm-deck-field').evaluate(e=>{
   e.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=10080});
   const cards=[...e.querySelectorAll('.lpm-card')].map(c=>c.getBoundingClientRect());
   return {xs:cards.map(c=>c.x),ys:cards.map(c=>c.y)};
 });
 check('desktop spread is seat-payment-ticket across one row',()=>assert.ok(spread.xs[0]<spread.xs[1]&&spread.xs[1]<spread.xs[2]&&Math.max(...spread.ys)-Math.min(...spread.ys)<2,JSON.stringify(spread)));
 await page.locator('.lpm-deck-field').evaluate(e=>e.getAnimations({subtree:true}).forEach(a=>{a.currentTime=11990;a.play()}));
 await page.waitForTimeout(400);
 const loop=await page.locator('.lpm-card-seat').evaluate(e=>({time:e.getAnimations()[0].currentTime,state:e.getAnimations()[0].playState}));
 check('deck restarts automatically after completing a loop',()=>assert.ok(loop.time<2000&&loop.state==='running',JSON.stringify(loop)));
 await page.setViewportSize({width:390,height:844});
 await page.locator('.lpm-deck-field').scrollIntoViewIfNeeded();
 await page.waitForTimeout(7000);
 const mobile=await page.locator('.lpm-deck-field').evaluate(e=>({height:e.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth}));

 const phoneCards=await page.locator('.lpm-deck-field').evaluate(e=>{
   e.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=10080});
   return [...e.querySelectorAll('.lpm-card')].map(c=>c.getBoundingClientRect().y);
 });
 check('phone keeps cards in the same stack through the spread phase',()=>assert.ok(Math.max(...phoneCards)-Math.min(...phoneCards)<100,JSON.stringify(phoneCards)));
 check('phone remains compact and does not spread vertically',()=>assert.ok(mobile.height<450&&!mobile.overflow,JSON.stringify(mobile)));
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await page.locator('.lpm-card-seat').evaluate(e=>e.getAnimations().every(a=>a.playState==='paused'));
 check('reduced motion stays still',()=>assert.ok(reduced));
} finally {await browser.close();}
if(failures.length)throw Error(failures.join('\n'));
