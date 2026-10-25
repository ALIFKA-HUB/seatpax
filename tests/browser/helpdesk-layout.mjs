import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const b=await chromium.launch({channel:'chrome',headless:true});
try {
 const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const base=process.env.SEATPAX_TEST_URL || 'http://localhost:3001';
 for(const width of [320,390,768,1024,1440]) {
  await p.setViewportSize({width,height:1000});
  for(const path of ['buat','cek']) {
   await p.goto(base+'/pengaduan/'+path,{waitUntil:'domcontentloaded'});await p.locator('h1').waitFor();await p.waitForLoadState('networkidle');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${path} overflow at ${width}`);
   if(path==='buat')assert.deepEqual(await p.locator('form [name]').evaluateAll(xs=>xs.map(x=>x.name)),['name','email','category','title','description','bookingReference','files']);
   console.log('PASS',path,width);
   if(process.env.SEATPAX_SCREENSHOTS&&(width===1440||width===390))await p.screenshot({path:process.env.SEATPAX_SCREENSHOTS+`/complaint-${path}-${width}.png`,fullPage:true});
  }
 }
 await p.waitForLoadState('networkidle');
 await p.route('**/api/pengaduan/cek',async route=>{await route.fulfill({status:404,json:{error:'Pengaduan tidak ditemukan. Periksa kembali nomornya.'}})});
 await p.getByLabel('Nomor tiket pengaduan').fill('SPX-ADU-INVALID');await p.getByRole('button',{name:'Cek pengaduan',exact:true}).click();
 await p.locator('.hd-error').waitFor();assert.match(await p.locator('.hd-error').textContent(),/tidak ditemukan/);
 await p.unroute('**/api/pengaduan/cek');
 await p.route('**/api/pengaduan/cek',r=>r.fulfill({json:{item:{code:'SPX-ADU-ABCDEF0123456789ABCDEF0123456789',title:'Pembayaran perlu diperiksa',status:'PERLU_DILENGKAPI',category:'PAYMENT',priority:'MEDIUM',updatedAt:'2026-10-25T10:00:00Z',publicRequest:'Sertakan bukti pembayaran.',publicOutcome:null}}}));
 await p.getByRole('button',{name:'Cek pengaduan',exact:true}).click();await p.locator('.hd-result').waitFor();assert.match(await p.locator('.hd-result').textContent(),/Sertakan bukti/);
 assert.equal(await p.locator('#riwayat li').count(),1);
 await p.setViewportSize({width:390,height:844});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(process.env.SEATPAX_SCREENSHOTS)await p.screenshot({path:process.env.SEATPAX_SCREENSHOTS+'/complaint-result-phone.png',fullPage:true});
 await p.goto(base+'/pengaduan/buat?pesanan=BOOKING-CONTEXT',{waitUntil:'domcontentloaded'});
 assert.equal(await p.locator('[name=bookingReference]').inputValue(),'BOOKING-CONTEXT');
 assert.deepEqual(errors,[]);console.log('PASS error/result/history/prefill and no client errors');
} finally {await b.close()}
