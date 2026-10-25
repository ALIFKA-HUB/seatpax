import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [account,path] of [['customer','/trips'],['admin-a','/admin'],['helpdesk','/helpdesk']]){
 const context=await browser.newContext();const page=await context.newPage();
 await page.goto('http://localhost:3001/login',{waitUntil:'networkidle'});
 await page.getByLabel('Akun testing').selectOption(account);
 await page.getByRole('button',{name:'Masuk tanpa OTP',exact:true}).click();
 try{await page.waitForURL(u=>path==='/admin'?u.pathname.startsWith('/admin/companies/'):u.pathname===path,{timeout:60000});}catch{console.log('LOGIN FAILURE',account,await page.locator('.auth-message').textContent());throw Error('Quick login failed');}
 if(account==='helpdesk')await page.getByRole('heading',{name:'Pengaduan pelanggan',exact:true}).waitFor();
 if(account==='admin-a')await page.getByRole('heading',{name:'Rute & tarif',exact:true}).waitFor();
 console.log('PASS real session',account,path);
 if(account==='customer'){
 await page.goto('http://localhost:3001/admin',{waitUntil:'networkidle'});
 assert.match(await page.locator('main').innerText(),/belum memiliki akses admin PO/);
 assert.equal(await page.locator('a[href^="/admin/companies/"]').count(),0);console.log('PASS Customer denied admin access');
 }
 if(account==='helpdesk'){
 await page.goto('http://localhost:3001/login',{waitUntil:'networkidle'});
 assert.equal(await page.getByLabel('Akun testing').count(),1);console.log('PASS logged-in tester can reopen account switcher');
 }
 await context.close();
 }
}finally{await browser.close()}
