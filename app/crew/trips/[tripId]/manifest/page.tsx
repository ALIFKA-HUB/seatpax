import Link from 'next/link';
import {notFound} from 'next/navigation';
import {boardingData} from '../../../boarding-data';
import ManifestList from '../../../components/manifest-list';
export default async function Page({params}:{params:Promise<{tripId:string}>}){const {tripId}=await params,{actor,service}=await boardingData();let view;try{view=await service.manifest(actor,tripId);}catch{notFound();}return <><header className="admin-header"><Link href={`/crew/trips/${tripId}`}>← Ringkasan trip</Link><h1>Manifest penumpang</h1><p>{view.tripName}</p><Link href={`/crew/trips/${tripId}/scan`}>Scan QR →</Link></header><section className="admin-panel"><ManifestList view={view}/></section></>;}
