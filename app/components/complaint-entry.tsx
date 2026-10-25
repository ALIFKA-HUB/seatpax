'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ChatCircleDots} from '@phosphor-icons/react';
import './complaint-entry.css';
export default function ComplaintEntry(){const path=usePathname();if(/^\/(pengaduan|helpdesk|admin|login|checkout|holds)(\/|$)/.test(path))return null;return <Link href="/pengaduan/buat" aria-label="Buat pengaduan" title="Buat pengaduan" className={'sp-complaint-entry'+(path==='/'?' sp-complaint-entry-landing':'')}><ChatCircleDots size={27} aria-hidden="true"/></Link>;}
