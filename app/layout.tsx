import type { Metadata } from "next";
import {Geist,Plus_Jakarta_Sans} from 'next/font/google';
import { THEME_STORAGE_KEY } from './components/theme-mode';
import "./globals.css";
const geist=Geist({subsets:['latin'],variable:'--font-geist',display:'swap'});
const jakarta=Plus_Jakarta_Sans({subsets:['latin'],variable:'--font-passenger-jakarta',display:'swap'});
const THEME_INIT_SCRIPT=`try{var m=localStorage.getItem('${THEME_STORAGE_KEY}');if(m==='dark'||m==='light')document.documentElement.dataset.mode=m;}catch(e){}`;

export const metadata: Metadata = {
  title: "Seatpax",
  description: "Ticketing dan operasional penumpang bus antarkota.",
  icons:{icon:'/brand/seatpax-icon.png',apple:'/brand/seatpax-icon.png'},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" className={`${geist.variable} ${jakarta.variable}`} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:THEME_INIT_SCRIPT}}/></head><body>{children}</body></html>;
}
