'use client';

import {Printer} from '@phosphor-icons/react';

export default function PrintButton(){
 return <button className="sp-secondary tk-print-hide" type="button" onClick={()=>window.print()}>
  <Printer size={16} aria-hidden="true" style={{marginRight:6}}/>Cetak / Simpan PDF
 </button>;
}
