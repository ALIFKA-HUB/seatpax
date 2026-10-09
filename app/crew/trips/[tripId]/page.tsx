import Link from 'next/link';
import {notFound} from 'next/navigation';
import {crewData} from '../../data';
import CrewTripSummary from '../../components/trip-summary';
export default async function Page({params}:{params:Promise<{tripId:string}>}) {
 const {tripId}=await params,{actorId,crew}=await crewData();
 let detail;try{detail=await crew.detailMine(actorId,tripId);}catch{notFound();}
 return <><header className="crew-page-header"><Link className="crew-back" href="/crew">← Perjalanan saya</Link><p className="crew-eyebrow">Perjalanan ditugaskan</p><h1>{detail.trip.name}</h1></header><CrewTripSummary detail={detail}/></>;
}
