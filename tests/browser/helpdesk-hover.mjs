import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const b=await chromium.launch({channel:'chrome',headless:true});
const luminance=rgb=>rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
try {
 const p=await b.newPage();
 for(const path of ['cek','buat']) {
  await p.goto((process.env.SEATPAX_TEST_URL || 'http://localhost:3001')+'/pengaduan/'+path,{waitUntil:'networkidle'});
  const button=p.locator('form button[type=submit]');await button.hover();
  const colors=await button.evaluate(e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));
  const a=luminance(colors.fg),z=luminance(colors.bg),contrast=(Math.max(a,z)+.05)/(Math.min(a,z)+.05);
  assert.ok(contrast>=4.5,`${path} hovered contrast ${contrast.toFixed(2)}: ${JSON.stringify(colors)}`);
  console.log('PASS',path,'hover contrast',contrast.toFixed(2));
 }
}finally{await b.close()}
