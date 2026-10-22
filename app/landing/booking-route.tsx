'use client';

import {useEffect, useId, useRef, useState, type ReactNode} from 'react';

/** Decorative explanation only; this does not represent an actual booking's state. */
export default function BookingRoute({children}: {children: ReactNode}) {
  const root = useRef<HTMLDivElement>(null);
  const maskId = useId();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const field = root.current;
    if (!field || typeof ResizeObserver === 'undefined') return;
    const svg = field.querySelector('svg')!;
    const track = field.querySelector<SVGPathElement>('.lp-route-track')!;
    const trace = field.querySelector<SVGPathElement>('.lp-route-trace')!;
    const reveal = field.querySelector<SVGPathElement>('.lp-route-reveal')!;
    const traveller = field.querySelector<HTMLElement>('.lp-route-traveller')!;
    const steps = Array.from(field.querySelectorAll<HTMLLIElement>('li'));
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;

    function measure() {
      if (disposed || !field || !field.clientWidth) return;
      const box = field.getBoundingClientRect();
      const points = steps.map(step => {
        const icon = step.querySelector<HTMLElement>('.lp-flow-icon')!;
        const item = step.getBoundingClientRect();
        // Use layout coordinates so a font/resize measurement cannot bake in the idle translation.
        return {x: item.left - box.left + icon.offsetLeft + icon.offsetWidth / 2, y: item.top - box.top + icon.offsetTop + icon.offsetHeight / 2};
      });
      const vertical = Math.abs(points[1].y - points[0].y) > 30;
      const bends = vertical ? [[-20, -12], [24, 18], [-10, 20]] : [[-48, -30], [34, 42], [-32, 26]];
      let path = `M ${points[0].x} ${points[0].y}`;
      const distances = [0];
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        const [u, v] = bends[i - 1];
        path += vertical
          ? ` C ${a.x + u} ${a.y + (b.y - a.y) * .28}, ${b.x + v} ${b.y - (b.y - a.y) * .28}, ${b.x} ${b.y}`
          : ` C ${a.x + (b.x - a.x) * .30} ${a.y + u}, ${b.x - (b.x - a.x) * .24} ${b.y + v}, ${b.x} ${b.y}`;
        track.setAttribute('d', path);
        distances.push(track.getTotalLength());
      }
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      trace.setAttribute('d', path);
      reveal.setAttribute('d', path);
      traveller.style.offsetPath = `path('${path}')`;
      const length = distances[distances.length - 1];
      steps.forEach((step, i) => step.style.setProperty('--route-delay', `${distances[i] / length * 4.2}s`));
      field.dataset.routeReady = 'true';
    }

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(field);
    document.fonts.ready.then(measure);
    field.dataset.routeMotion = preference.matches || typeof IntersectionObserver === 'undefined' ? 'static' : 'pending';
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      field.dataset.routeMotion = preference.matches ? 'static' : 'playing';
      observer?.disconnect();
    }, {threshold: .3});
    observer?.observe(field);
    const reduce = () => {
      if (preference.matches) field.dataset.routeMotion = 'static';
    };
    preference.addEventListener('change', reduce);
    return () => {
      disposed = true;
      resize.disconnect();
      observer?.disconnect();
      preference.removeEventListener('change', reduce);
    };
  }, []);

  return <div className="lp-route" ref={root} data-route-paused={paused}>
    <svg className="lp-route-lines" aria-hidden="true" focusable="false">
      <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="-100" y="-100" width="3000" height="3000">
        <path className="lp-route-reveal" pathLength="1"/>
      </mask></defs>
      <path className="lp-route-track"/>
      <path className="lp-route-trace" mask={`url(#${maskId})`}/>
    </svg>
    <span className="lp-route-traveller" aria-hidden="true"/>
    {children}
    <div className="lp-route-controls"><button className="lp-motion-toggle" type="button" onClick={() => setPaused(value => !value)}>
      {paused ? 'Lanjutkan animasi' : 'Jeda animasi'}
    </button></div>
  </div>;
}
