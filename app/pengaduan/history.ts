export type HistoryItem={code:string;lastAccessedAt:number;label:string};
const valid=(code:unknown):code is string=>typeof code==='string'&&/^SPX-ADU-[A-F0-9]{32}$/.test(code);
export function parseHistory(raw:string|null):HistoryItem[]{try{const items:unknown=JSON.parse(raw||'[]');if(!Array.isArray(items))return [];return items.filter(v=>v&&valid(v.code)&&Number.isFinite(v.lastAccessedAt)).slice(0,20).map(v=>({code:v.code,lastAccessedAt:v.lastAccessedAt,label:'Pengaduan tersimpan'}));}catch{return [];}}
export function mergeHistory(items:HistoryItem[],code:string,now=Date.now()):HistoryItem[]{return valid(code)?[{code,lastAccessedAt:now,label:'Pengaduan tersimpan'},...items.filter(i=>i.code!==code)].slice(0,20):items;}
export function readHistory(){try{return parseHistory(localStorage.getItem('seatpax-complaints'));}catch{return [];}}
export function rememberCode(code:string){try{localStorage.setItem('seatpax-complaints',JSON.stringify(mergeHistory(readHistory(),code)));window.dispatchEvent(new Event('seatpax-complaints'));}catch{/* Tracking works without browser storage. */}}
export function clearHistory(){try{localStorage.removeItem('seatpax-complaints');}catch{/* Storage may be blocked. */}}
