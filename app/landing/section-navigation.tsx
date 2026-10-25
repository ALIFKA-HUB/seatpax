'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {List, X} from '@phosphor-icons/react';

const sections = [
  ['beranda', 'Beranda'],
  ['cara-memesan', 'Cara pesan'],
  ['persiapan', 'Persiapan'],
  ['alur-pemesanan', 'Pemesanan'],
  ['bantuan', 'Bantuan'],
] as const;

export default function SectionNavigation() {
  const [active, setActive] = useState<string>('beranda');
  const disclosure = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(() => {
      const visible = [...document.querySelectorAll<HTMLElement>('[data-landing-section]')]
        .map(section => ({id: section.id, bounds: section.getBoundingClientRect()}))
        .filter(section => section.bounds.bottom > 104 && section.bounds.top < innerHeight * .55)
        .sort((a, b) => a.bounds.top - b.bounds.top);
      if (visible[0]) setActive(['pilihan-perjalanan', 'pilih-kursi'].includes(visible[0].id) ? 'beranda' : visible[0].id);
    }, {rootMargin: '-104px 0px -45% 0px', threshold: [0, .2, .5, .8]});
    document.querySelectorAll('[data-landing-section]').forEach(section => observer?.observe(section));
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && disclosure.current && !disclosure.current.contains(event.target)) disclosure.current.open = false;
    };
    document.addEventListener('pointerdown', outside);
    return () => {observer?.disconnect(); document.removeEventListener('pointerdown', outside);};
  }, []);

  const links = sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => {setActive(id); if (disclosure.current) disclosure.current.open = false;}}><span>{label}</span></a>);

  return <div className="lp-navigation">
    <nav className="lp-section-nav lp-section-nav-wide" aria-label="Bagian landing Seatpax">{links}</nav>
    <details className="lp-section-disclosure" ref={disclosure} onKeyDown={event => {
      if (event.key === 'Escape' && disclosure.current?.open) {disclosure.current.open = false; disclosure.current.querySelector('summary')?.focus();}
    }} onBlur={event => {if (disclosure.current && (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget))) disclosure.current.open = false;}}>
      <summary className="lp-section-menu" aria-label="Navigasi bagian halaman"><List size={23} aria-hidden="true"/><X size={23} aria-hidden="true"/><span>Menu</span></summary>
      <nav className="lp-section-nav lp-section-nav-compact" aria-label="Bagian landing Seatpax pada layar kecil">
        {links}<Link className="lp-section-order-link" href="/tickets" onClick={() => {if (disclosure.current) disclosure.current.open = false;}}><span>Pesanan saya</span></Link>
      </nav>
    </details>
  </div>;
}
