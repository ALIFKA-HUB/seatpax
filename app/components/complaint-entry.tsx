'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {FilePlus} from '@phosphor-icons/react';
import './complaint-entry.css';
export default function ComplaintEntry(){const path=usePathname();if(/^\/(pengaduan|helpdesk|admin|login|checkout|holds)(\/|$)/.test(path))return null;return <Link href="/pengaduan/buat" className={'sp-complaint-entry'+(path==='/'?' sp-complaint-entry-landing':'')}><FilePlus size={22} aria-hidden="true"/><span>Buat pengaduan</span></Link>;}
