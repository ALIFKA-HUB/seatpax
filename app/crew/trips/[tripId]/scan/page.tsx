import Link from 'next/link';
import {notFound} from 'next/navigation';
import {boardingData} from '../../../boarding-data';
import TicketScanner from '../../../components/qr-scanner';
export default async function Page({params}:{params:Promise<{tripId:string}>}){const {tripId}=await params,{actor,service}=await boardingData();let view;try{view=await service.manifest(actor,tripId);}catch{notFound();}return <><header className="crew-page-header"><Link className="crew-back" href={`/crew/trips/${tripId}/manifest`}>← Manifest</Link><h1>Scan tiket penumpang</h1></header><section className="crew-panel"><TicketScanner tripId={tripId} stops={view.stops}/></section></>;}
