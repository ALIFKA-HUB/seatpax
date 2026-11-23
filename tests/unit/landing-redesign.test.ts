import {createElement as h} from 'react';
import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup as render} from 'react-dom/server';
import FeaturedTrips from '@/app/landing/featured-trips';
import LandingSearch from '@/app/landing/search';
import BookingRoute from '@/app/landing/booking-route';
import BookingMotion from '@/app/landing/booking-motion';
import HeroStage from '@/app/landing/hero-stage';
import PreparationShowcase from '@/app/landing/preparation-showcase';
import {buildBoardingStandGeometry} from '@/app/landing/iso/boarding-stand-geometry';

describe('UI-LANDING-01 contracts', () => {
  it('renders orange accent submit CTA and swap button in LandingSearch', () => {
    const html = render(h(LandingSearch, {
      locations: [{id: 'a', name: 'Pool Pasteur', city: 'Bandung'}],
      date: '2026-11-22',
    }));
    expect(html).toContain('lp-cta-accent');
    expect(html).toContain('Cari perjalanan');
    expect(html).toContain('lp-swap');
  });

  it('renders boarding-pass demo cards with honest disclaimer in FeaturedTrips', () => {
    const html = render(h(FeaturedTrips));
    expect(html).toContain('lp-pass-card');
    expect(html).toContain('lp-pass-stub');
    expect(html).toContain('Contoh tampilan');
    expect(html).toContain('Cianjur');
  });

  it('preserves SVG track line structure in BookingRoute', () => {
    const html = render(h(BookingRoute, null, h('ol', {className: 'lp-booking-flow'}, h('li', null, 'Step 1'))));
    expect(html).toContain('lp-route-lines');
    expect(html).toContain('lp-route-trace');
    expect(html).toContain('lp-route-track');
    expect(html).toContain('lp-route-reveal');
    expect(html).toContain('lp-route-traveller');
  });

  it('renders side-by-side interactive seat grid (01-09) and live ticket in BookingMotion seat mode and 3-step controls in deck mode', () => {
    const seatHtml = render(h(BookingMotion, {kind: 'seat'}));
    expect(seatHtml).toContain('03');
    expect(seatHtml).toContain('09');
    expect(seatHtml).toContain('lpm-seat-btn');
    expect(seatHtml).toContain('lpm-seat-pair');
    expect(seatHtml).toContain('Tiket siap dibuka.');
    expect(seatHtml).toContain('Pembayaran dikonfirmasi');

    const deckHtml = render(h(BookingMotion, {kind: 'deck'}));
    expect(deckHtml).toContain('Kursi');
    expect(deckHtml).toContain('Pembayaran');
    expect(deckHtml).toContain('Tiket');
    expect(deckHtml).toContain('lpm-step-tabs');
  });

  it('builds a dense isometric QR Boarding Gate geometry (45+ parts) and renders Fig 01 in PreparationShowcase', () => {
    const geo = buildBoardingStandGeometry();
    expect(geo.partCount).toBeGreaterThanOrEqual(45);
    expect(geo.staticSolids.length).toBeGreaterThan(25);

    const html = render(h(PreparationShowcase));
    expect(html).toContain('Fig 01');
    expect(html).toContain('QR Boarding Gate');
    expect(html).toContain('Tahu harus naik di mana');
    expect(html).toContain('Waktunya sudah sesuai');
    expect(html).toContain('Tiket tinggal ditunjukkan');
  });

  it('renders art-directed cabin visual and route arc in HeroStage without decorative metric fluff', () => {
    const html = render(h(HeroStage));
    expect(html).toContain('hero-shuttle.jpg');
    expect(html).toContain('lp-hero-frame');
    expect(html).toContain('lp-hero-arc');
  });
});
