import {it,expect} from 'vitest';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {AccountControl} from '@/app/components/passenger-account-menu';

it('routes unknown identity to login without a standalone account page',()=>{
 const html=render(h(AccountControl,{status:'unknown',pending:false,message:'',onLogout(){}}));
 expect(html).toContain('href="/login"');expect(html).toContain('Akun');expect(html).not.toContain('/account');expect(html).not.toContain('Profil saya');
});
it('offers real login for a guest',()=>{
 const html=render(h(AccountControl,{status:'guest',pending:false,message:'',onLogout(){}}));
 expect(html).toContain('href="/login"');expect(html).toContain('Masuk');expect(html).not.toContain('<details');
});
it('uses native disclosure with orders shortcut and logout controls',()=>{
 const html=render(h(AccountControl,{status:'signed-in',pending:false,message:'',onLogout(){}}));
 for(const text of ['<details','<summary','Pesanan saya','href="/tickets"','Keluar'])expect(html).toContain(text);
 expect(html).not.toContain('href="/login"');expect(html).not.toContain('/account');expect(html).not.toContain('Profil saya');
});
it('keeps logout feedback readable and prevents duplicate submission',()=>{
 const html=render(h(AccountControl,{status:'signed-in',pending:true,message:'Coba lagi.',onLogout(){}}));
 expect(html).toContain('disabled');expect(html).toContain('Keluar…');expect(html).toContain('role="status"');expect(html).toContain('Coba lagi.');
});
