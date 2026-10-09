import Link from 'next/link';
import {notFound} from 'next/navigation';
import {boardingData} from '../../../boarding-data';
import ManifestList from '../../../components/manifest-list';
import {wibTime} from '../../../components/passenger-profile';
export default async function Page({params}:{params:Promise<{tripId:string}>}) {
 const {tripId}=await params,{actor,service}=await boardingData();
 let view;try{view=await service.manifest(actor,tripId);}catch{notFound();}
 return <><header className="crew-page-header"><Link className="crew-back" href={`/crew/trips/${tripId}`}>← Ringkasan trip</Link><h1>Manifest penumpang</h1><p className="crew-muted">{view.tripName} · {wibTime(view.departureAt)}</p><div className="crew-actions"><Link className="crew-button crew-primary" href={`/crew/trips/${tripId}/scan`}>Scan QR</Link></div></header><section className="crew-panel"><ManifestList view={view}/></section></>;
}
