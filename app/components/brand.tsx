import Link from 'next/link';
import Image from 'next/image';

export default function Brand({compact=false,href='/'}:{compact?:boolean;href?:string}) {
 return <Link href={href} aria-label="Seatpax" className={`sp-brand${compact?' sp-brand-compact':''}`}>
  <Image src={compact?'/brand/seatpax-icon.png':'/brand/seatpax-horizontal.png'} alt="" width={compact?1254:2140} height={compact?1254:735} />
 </Link>;
}
