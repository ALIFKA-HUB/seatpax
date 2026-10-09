import Link from 'next/link';
import {notFound} from 'next/navigation';
import {boardingData} from '../../../../boarding-data';
import PassengerProfile from '../../../../components/passenger-profile';
import BoardingForm from '../../../../components/boarding-form';
import SnackForm from '../../../../components/snack-form';
export default async function Page({params}:{params:Promise<{tripId:string;ticketId:string}>}){const {tripId,ticketId}=await params,{actor,service}=await boardingData();let view,profile;try{view=await service.manifest(actor,tripId);profile=await service.profile(actor,tripId,ticketId);}catch{notFound();}return <><header className="admin-header"><Link href={`/crew/trips/${tripId}/manifest`}>← Manifest</Link><h1>Profil penumpang</h1></header><section className="admin-panel"><PassengerProfile profile={profile}/><BoardingForm tripId={tripId} profile={profile} stops={view.stops} source="MANIFEST"/><SnackForm key={profile.ticketId} tripId={tripId} profile={profile}/></section></>;}
