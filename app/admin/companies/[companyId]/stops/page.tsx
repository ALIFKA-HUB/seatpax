import {companyData} from '../../../data';
import StopDirectory from '../../../components/stop-directory';
export default async function Page({params}:{params:Promise<{companyId:string}>}){const {companyId}=await params;const {data}=await companyData(companyId);return <StopDirectory companyId={companyId} stops={data.stops}/>;}
