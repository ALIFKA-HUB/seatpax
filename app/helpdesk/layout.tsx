import type {ReactNode} from 'react';
import '../pengaduan/pengaduan.css';
import './helpdesk.css';
import HelpdeskShell from './components/helpdesk-shell';

export const metadata={title:'Helpdesk | Seatpax',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';

export default function HelpdeskLayout({children}:{children:ReactNode}){
 return <HelpdeskShell>{children}</HelpdeskShell>;
}
