export type MotionKind = 'seat' | 'deck';
export type BookingMotionState = {playing: boolean; step: 0 | 1 | 2; finished: boolean; static: boolean; phase: string};
type Parts = Record<string, HTMLElement>;
type Animate = (element: HTMLElement, frames: Keyframe[]) => void;

const DURATION = 8000;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {const t = clamp(n); return t * t * t * (t * (t * 6 - 15) + 10);};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const samples = Array.from({length: 361}, (_, i) => i / 360);
const rgb = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;

function seatTimeline(field: HTMLElement, p: Parts, animate: Animate) {
  const target = p.map.querySelector<HTMLElement>('.lpm-chosen')!;
  const box = field.getBoundingClientRect(), seat = target.getBoundingClientRect(), paper = p.paper.getBoundingClientRect(), destination = p.destination.getBoundingClientRect();
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  const tx = seat.left + seat.width / 2 - cx, ty = seat.top + seat.height / 2 - cy;
  const px = paper.left + paper.width / 2 - cx, py = paper.top + paper.height / 2 - cy;
  const dx = destination.left + destination.width / 2 - cx, dy = destination.top + destination.height / 2 - cy;
  const type = getComputedStyle(p.destination), initialScale = parseFloat(getComputedStyle(target).fontSize) / parseFloat(type.fontSize);
  Object.assign(p.number.style, {width: `${destination.width}px`, height: `${destination.height}px`, fontSize: type.fontSize, fontWeight: type.fontWeight, letterSpacing: type.letterSpacing, lineHeight: type.lineHeight});
  Object.assign(p.surface.style, {width: `${paper.width}px`, height: `${paper.height}px`});
  const path = (u: number) => {const v = 1 - u; return [v ** 3 * tx + 3 * v * v * u * tx + 3 * v * u * u * (px - 25) + u ** 3 * px, v ** 3 * ty + 3 * v * v * u * (ty - 60) + 3 * v * u * u * (py - 24) + u ** 3 * py];};

  animate(p.surface, samples.map(t => {
    const u = ease((t - .195) / .275), g = ease((t - .25) / .22), c = ease((t - .29) / .18), [x, y] = path(u);
    const sx = lerp(seat.width / paper.width, 1, g), sy = lerp(seat.height / paper.height, 1, g);
    const radius = lerp(11, 20, g), bottom = lerp(11, 0, g);
    return {offset: t, transform: `translate(-50%,-50%) translate3d(${x}px,${y}px,0) rotate(${-2 * (1 - u)}deg) scale(${sx},${sy})`, opacity: ease((t - .18) / .015), backgroundColor: rgb([0,100,244], [255,255,255], c), borderColor: rgb([0,100,244], [203,220,242], c), borderRadius: `${radius / sx}px ${radius / sx}px ${bottom / sx}px ${bottom / sx}px / ${radius / sy}px ${radius / sy}px ${bottom / sy}px ${bottom / sy}px`};
  }));
  animate(p.number, samples.map(t => {
    const u = ease((t - .195) / .275), g = ease((t - .25) / .22), [x, y] = path(u), scale = lerp(initialScale, 1, g);
    return {offset: t, transform: `translate(-50%,-50%) translate3d(${x + (dx - px) * g}px,${y + (dy - py) * g}px,0) rotate(${-2 * (1 - u)}deg) scale(${scale})`, opacity: ease((t - .18) / .015), color: rgb([255,255,255], [10,33,73], ease((t - .355) / .115))};
  }));
  animate(target, [{offset: 0, opacity: 1}, {offset: .18, opacity: 1}, {offset: .195, opacity: 0}, {offset: 1, opacity: 0}]);
  animate(p.map, samples.map(t => {const u = ease((t - .235) / .185); return {offset: t, transform: `translate(-50%,-50%) translate3d(${-30 * u}px,0,0) rotate(${-2 - 2 * u}deg) scale(${1 - .06 * u})`, opacity: 1 - u};}));
  animate(p.focus, samples.map(t => ({offset: t, transform: `translate(-50%,-50%) translate(${tx}px,${ty}px) scale(${.85 + .4 * ease((t - .11) / .1)})`, opacity: .55 * ease((t - .11) / .03) * (1 - ease((t - .145) / .065))})));
  animate(p.cursor, samples.map(t => {const u = ease((t - .03) / .075); return {offset: t, transform: `translate(${tx + 38 - 25 * u}px,${ty + 36 - 25 * u}px)`, opacity: ease(t / .03) * (1 - ease((t - .15) / .06))};}));
  animate(p.rail, samples.map(t => ({offset: t, opacity: 1 - ease((t - .25) / .08)})));
  animate(p.content, samples.map(t => ({offset: t, opacity: ease((t - .44) / .1), transform: `translateY(${5 * (1 - ease((t - .44) / .1))}px)`})));
  animate(p.stub, samples.map(t => ({offset: t, opacity: ease((t - .49) / .09), transform: `translateY(${-6 * (1 - ease((t - .49) / .09))}px)`})));
  animate(p.seal, samples.map(t => {const u = ease((t - .66) / .055); return {offset: t, opacity: u, transform: `scale(${.9 + .1 * u})`};}));
}

type CardPose = {x: number; y: number; z: number; angle: number; scale: number};
function deckTimeline(field: HTMLElement, p: Parts, animate: Animate) {
  const narrow = window.matchMedia('(max-width: 767px)').matches, w = p.seat.offsetWidth;
  const q = narrow ? .68 : .88, side = (w * q + 26) / 2, rest = narrow ? 38 : 82;
  const finalScale = narrow ? 1 : Math.min(.94, (field.clientWidth - 64) / (3 * w + 36));
  const stride = w * finalScale + 18;
  const initial: CardPose[] = [{x:0,y:0,z:30,angle:0,scale:1}, {x:rest,y:5,z:-10,angle:5,scale:.9}, {x:-rest,y:9,z:-50,angle:-5,scale:.88}];
  const first: CardPose[] = [{x:-rest,y:0,z:-35,angle:-5,scale:.9}, {x:0,y:0,z:30,angle:0,scale:1}, initial[2]];
  const second: CardPose[] = [{x:-rest,y:0,z:-65,angle:-5,scale:.88}, {x:-rest*.45,y:0,z:-10,angle:-2,scale:.92}, {x:0,y:0,z:30,angle:0,scale:1}];
  function arc(a: CardPose, b: CardPose, s: number, peak: number, lift: number): CardPose {
    const wave = Math.sin(Math.PI * s);
    return {x: lerp(a.x,b.x,s) + (peak-(a.x+b.x)/2)*wave, y:lerp(a.y,b.y,s)+lift*wave, z:lerp(a.z,b.z,ease((s-.44)/.12)), angle:lerp(a.angle,b.angle,s)-(a.angle+b.angle)/2*wave+1.7*Math.sin(2*Math.PI*s), scale:lerp(a.scale,b.scale,s)+(q-(a.scale+b.scale)/2)*wave};
  }
  [p.seat,p.payment,p.ticket].forEach((card,index) => animate(card, samples.map(offset => {
    const t = Math.min(1, offset / .8);
    let pose = t < .55
      ? index === 2 ? initial[2] : arc(initial[index],first[index],ease((t-.275)/.215),index===0?-side:side,index===0?14:-18)
      : arc(first[index],second[index],ease((t-.55)/.235),index===2?side:-side,index===2?-18:12);
    const u=narrow?0:clamp((t-(.815+index*.008))/(.185-index*.008)), s=ease(u);
    pose={x:lerp(pose.x,narrow?0:(index-1)*stride,s),y:lerp(pose.y,0,s)-Math.sin(Math.PI*u)*4,z:lerp(pose.z,0,ease((u-.65)/.35)),angle:lerp(pose.angle,0,s)+(index-1)*2*Math.sin(Math.PI*u),scale:lerp(pose.scale,finalScale,s)};
    const back = ease((offset - .88) / .12);
    if (narrow && offset >= .8) {
      pose = arc(second[index], initial[index], ease((offset-.8)/.2), index===0?side:-side, index===0?-18:12);
    } else if (!narrow) {
      pose = {x:lerp(pose.x,initial[index].x,back),y:lerp(pose.y,initial[index].y,back),z:lerp(pose.z,initial[index].z,back),angle:lerp(pose.angle,initial[index].angle,back),scale:lerp(pose.scale,initial[index].scale,back)};
    }
    // Do not add opacity to these 3D planes: it flattens the card group.
    return {offset,transform:`translate(-50%,-50%) translate3d(${pose.x}px,${pose.y}px,${pose.z}px) rotateZ(${pose.angle}deg) scale(${pose.scale})`};
  })));
  animate(p.check, samples.map(t => {const u=ease((t/.8-.475)/.05)*(1-ease((t-.88)/.12));return {offset:t,opacity:u,transform:`scale(${.9+.1*u})`};}));
  animate(p.ring, samples.map(offset => {const t=offset/.8;return {offset,opacity:.55*ease((t-.47)/.04)*(1-ease((t-.51)/.08)),transform:`scale(${.9+.4*ease((t-.47)/.12)})`};}));
}

export function mountBookingMotion(root: HTMLElement, kind: MotionKind, onChange: (state: BookingMotionState) => void) {
  const field = root.querySelector<HTMLElement>('.lpm-field')!;
  const parts = Object.fromEntries(Array.from(root.querySelectorAll<HTMLElement>('[data-part]'), e => [e.dataset.part!, e]));
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = kind === 'deck' ? 12000 : DURATION;
  let animations: Animation[] = [], time=0, limit=duration, playing=false, disposed=false, visible=false, canAutoStart=false, started=false, resume=false, frame=0, measuredWidth=0, lastState='';
  const supported = typeof field.animate === 'function' && typeof IntersectionObserver !== 'undefined';
  const phase = () => kind === 'seat'
    ? time < 1120 ? 'Pilih kursi Anda.' : time < 2240 ? 'Kursi 03 dipilih.' : time < 2960 ? 'Pilihan Anda diteruskan.' : time < 5440 ? 'Setelah pembayaran dikonfirmasi.' : 'Tiket siap di Pesanan saya.'
    : time >= DURATION ? 'Pilih kursi, bayar, lalu buka tiket.' : time >= 6880 ? 'Tiga langkah, satu perjalanan.' : time >= 5840 ? 'Tiket siap dibuka.' : time >= 4400 ? 'Tekan kartu lagi untuk membuka tiket.' : time >= 3440 ? 'Selesaikan pembayaran.' : 'Tekan kartu untuk melihat pembayaran.';
  function notify() {
    const state: BookingMotionState = {playing, step:time>=DURATION?2:time>=4400?1:0, finished:time>=DURATION, static:!supported||preference.matches, phase:phase()};
    const key=JSON.stringify(state);if(key!==lastState&&!disposed){lastState=key;onChange(state);}
  }
  function seek(value: number) {time=Math.max(0,Math.min(duration,value));animations.forEach(a=>{a.pause();a.currentTime=time;});notify();}
  function pause() {
    if(playing)time=Math.max(0,Math.min(limit,Number(animations[0]?.currentTime)||0));
    playing=false;cancelAnimationFrame(frame);animations.forEach(a=>a.pause());notify();
  }
  function run() {
    if(disposed||!animations.length||preference.matches)return;
    if(!visible||document.hidden){resume=true;return;}
    playing=true;resume=false;
    const rate=1,origin=Number(document.timeline.currentTime)-time/rate;
    animations.forEach(a=>{a.playbackRate=rate;a.play();a.startTime=origin;});notify();
    const tick=()=>{if(!playing||disposed)return;time=Number(animations[0].currentTime)||0;if(time>=limit){playing=false;if(kind==='deck'){seek(0);run();}else seek(limit);return;}notify();frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);
  }
  function build() {
    if(disposed||!field.clientWidth||!supported)return;
    animations.forEach(a=>a.cancel());animations=[];delete root.dataset.motionReady;
    measuredWidth=field.clientWidth;
    root.dataset.motionReady='true';
    const animate: Animate=(element,frames)=>{const a=element.animate(frames,{duration,fill:'both',easing:'linear'});a.pause();animations.push(a);};
    if(kind==='seat')seatTimeline(field,parts,animate);else deckTimeline(field,parts,animate);
    seek(preference.matches?duration:time);
  }
  function rebuild() {const active=playing;pause();build();if(active)run();}
  function presence() {
    if(!visible||document.hidden){if(playing){pause();resume=true;}return;}
    if(resume)run();else if(!started&&canAutoStart&&!preference.matches){started=true;limit=duration;run();}
  }
  function advance() {
    if(kind!=='deck'||disposed||!supported||preference.matches)return;
    if(!playing){started=true;limit=duration;run();}
    animations.forEach(a=>a.updatePlaybackRate(2.5));
  }
  function restart() {if(kind!=='deck')return;pause();resume=false;seek(0);}
  const onPreference=()=>{pause();resume=false;if(preference.matches){started=true;seek(duration);}else notify();};
  if(!supported){time=duration;notify();return {advance,restart,dispose:()=>{disposed=true;}};}
  build();
  const intersection=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);canAutoStart=entries.some(e=>e.intersectionRatio>=.35);presence();},{threshold:[0,.35]});
  intersection.observe(field);
  const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>{if(field.clientWidth!==measuredWidth)rebuild();});
  resize?.observe(field);
  const onResize=()=>{if(field.clientWidth!==measuredWidth)rebuild();};
  if(!resize)window.addEventListener('resize',onResize);
  document.addEventListener('visibilitychange',presence);preference.addEventListener('change',onPreference);
  document.fonts.addEventListener('loadingdone',rebuild);
  document.fonts.ready.then(()=>{if(!disposed)rebuild();});
  return {advance,restart,dispose:()=>{disposed=true;cancelAnimationFrame(frame);animations.forEach(a=>a.cancel());intersection.disconnect();resize?.disconnect();window.removeEventListener('resize',onResize);document.removeEventListener('visibilitychange',presence);preference.removeEventListener('change',onPreference);document.fonts.removeEventListener('loadingdone',rebuild);delete root.dataset.motionReady;}};
}
