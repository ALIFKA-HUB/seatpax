'use client';
type SnapWindow=Window&{snap?:{pay:(token:string,callbacks:{onSuccess:()=>void;onPending:()=>void;onError:()=>void;onClose:()=>void})=>void}};
export async function openSnap(token:string,clientKey:string,onRefresh:()=>void){
 await new Promise<void>((resolve,reject)=>{const current=document.querySelector<HTMLScriptElement>('script[data-seatpax-snap]');if(current){if((window as SnapWindow).snap)return resolve();current.addEventListener('load',()=>resolve(),{once:true});current.addEventListener('error',()=>reject(),{once:true});return;}const script=document.createElement('script');script.src='https://app.sandbox.midtrans.com/snap/snap.js';script.dataset.seatpaxSnap='true';script.dataset.clientKey=clientKey;script.onload=()=>resolve();script.onerror=()=>reject();document.head.append(script);});
 const snap=(window as SnapWindow).snap;if(!snap)throw new Error('Snap unavailable');const refresh=()=>onRefresh();snap.pay(token,{onSuccess:refresh,onPending:refresh,onError:refresh,onClose:refresh});
}
