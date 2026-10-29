import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Synthetic shell fixture only: no staff login, API calls, or database reads.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(import.meta.dirname, '../..');
const css = await readFile(resolve(root, 'app/helpdesk/helpdesk.css'), 'utf8');
const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const fixture = `
    <div class="hd-workspace">
      <aside class="hd-sidebar"><div class="sp-brand">Seatpax</div>
        <nav class="hd-side-nav"><a aria-current="page">Dashboard</a><a>Pengaduan</a></nav>
        <div class="hd-side-bottom"><a>Ke Seatpax</a><a>Akun &amp; keluar</a></div>
      </aside>
      <div class="hd-workarea">
        <header class="hd-mobile-bar"><div class="sp-brand">Seatpax</div><button aria-expanded="true">Tutup navigasi</button></header>
        <div class="hd-mobile-nav"><nav class="hd-side-nav"><a aria-current="page">Dashboard</a><a>Pengaduan</a></nav><div class="hd-side-bottom"><a>Ke Seatpax</a><a>Akun &amp; keluar</a></div></div>
        <main class="hd-main"><section class="hd">
          <header class="hd-heading"><h1>Dashboard Helpdesk</h1></header>
          <div class="hd-stat-grid">${['Menunggu', 'Diproses', 'Perlu dilengkapi', 'Selesai'].map((label) => `<a class="hd-stat"><strong>12</strong><span>${label}</span></a>`).join('')}</div>
          <div class="hd-dashboard-grid"><section class="hd-panel"><h2>Antrean pengaduan</h2><ul class="hd-queue"><li><a>${'Long complaint title '.repeat(5)}</a><p>${'Long description '.repeat(8)}</p></li></ul></section><section class="hd-panel"><h2>Aktivitas terbaru</h2><ul class="hd-activity"><li><p>${'Long update '.repeat(8)}</p></li></ul></section></div>
        </section></main>
      </div>
    </div>`;

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(`<style>${css}</style>${fixture}`);
    const state = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      mobileBar: getComputedStyle(document.querySelector('.hd-mobile-bar')).display,
      mobileMenu: getComputedStyle(document.querySelector('.hd-mobile-nav')).display,
      smallestTarget: Math.min(...[...document.querySelectorAll('.hd-side-nav a,.hd-side-bottom>a,.hd-mobile-bar button')].filter((el) => el.getClientRects().length).map((el) => el.getBoundingClientRect().height)),
      statsColumns: getComputedStyle(document.querySelector('.hd-stat-grid')).gridTemplateColumns.split(' ').length,
    }));
    assert.equal(state.documentWidth > state.viewportWidth, false, `page overflow at ${width}px`);
    assert.equal(state.mobileBar !== 'none', width <= 767, `mobile header breakpoint at ${width}px`);
    assert.ok(state.smallestTarget >= 44, `small navigation target at ${width}px: ${JSON.stringify(state)}`);
    if (width <= 359) assert.equal(state.statsColumns, 2, `status cards collapse at ${width}px`);
    console.log(`PASS synthetic Helpdesk shell ${width}px`, JSON.stringify(state));
  }
} finally {
  await browser.close();
}
