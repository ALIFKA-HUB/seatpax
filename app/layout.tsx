import type { Metadata } from "next";
import {Geist} from 'next/font/google';
import "./globals.css";
const geist=Geist({subsets:['latin'],variable:'--font-geist',display:'swap'});

export const metadata: Metadata = {
  title: "Seatpax",
  description: "Ticketing dan operasional penumpang bus antarkota.",
  icons:{icon:'/brand/seatpax-icon.png',apple:'/brand/seatpax-icon.png'},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" className={geist.variable}><body>{children}</body></html>;
}
