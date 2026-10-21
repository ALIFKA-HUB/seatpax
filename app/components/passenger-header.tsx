'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';

export default function PassengerHeader({children,animated=true}:{children:ReactNode;animated?:boolean}){
 const marker=useRef<HTMLSpanElement>(null);
 const [floating,setFloating]=useState(false);
 useEffect(()=>{
  if(!animated||!marker.current)return;
  if(!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
   const entry=entries[0];
   if(entry)setFloating(!entry.isIntersecting&&entry.boundingClientRect.top<0);
  });
  observer.observe(marker.current);
  return()=>observer.disconnect();
 },[animated]);
 return <>{animated&&<span ref={marker} className="sp-header-marker" aria-hidden="true"/>}<header className="sp-header" data-floating={animated&&floating?'true':'false'}><div className="sp-header-inner">{children}</div></header></>;
}
