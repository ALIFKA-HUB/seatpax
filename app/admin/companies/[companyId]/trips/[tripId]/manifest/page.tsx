import Link from 'next/link';
import {notFound} from 'next/navigation';
import {boardingData,enforceManifestCompany} from '@/app/crew/boarding-data';
import ManifestList from '@/app/crew/components/manifest-list';
export default async function Page({params}:{params:Promise<{companyId:string;tripId:string}>}){const {companyId,tripId}=await params,{actor,service}=await boardingData('ADMIN_PO');let view;try{view=await service.manifest(actor,tripId);enforceManifestCompany(view.companyId,companyId);}catch{notFound();}return <><header className="admin-header"><Link href={`/admin/companies/${companyId}/trips/${tripId}`}>← Ringkasan trip</Link><h1>Manifest penumpang</h1><p>{view.tripName}</p></header><section className="admin-panel"><ManifestList view={view} readOnly/></section></>;}
