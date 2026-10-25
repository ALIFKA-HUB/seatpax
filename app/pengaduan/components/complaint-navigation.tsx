'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {FilePlus,ClipboardText} from '@phosphor-icons/react';
export default function ComplaintNavigation(){const path=usePathname();return <nav aria-label="Navigasi pengaduan"><Link href="/pengaduan/buat" aria-current={path==='/pengaduan/buat'?'page':undefined}><FilePlus size={19} weight="light" aria-hidden="true"/><span>Buat pengaduan</span></Link><Link href="/pengaduan/cek" aria-current={path==='/pengaduan/cek'||path==='/pengaduan/lengkapi'?'page':undefined}><ClipboardText size={19} weight="light" aria-hidden="true"/><span>Cek pengaduan</span></Link></nav>;}
