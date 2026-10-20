import {companyData} from '../../../data';
import StopDirectory from '../../../components/stop-directory';
import {getDatabase} from '@/lib/db';
import {createRegionRepository} from '@/modules/regions/repository';
import {emptyRegionOptions} from '@/modules/regions/types';
export default async function Page({params}:{params:Promise<{companyId:string}>}) {
 const {companyId}=await params;
 const {data}=await companyData(companyId);
 const regionOptions=await createRegionRepository(getDatabase().$client).readOptions().catch(()=>emptyRegionOptions);
 return <StopDirectory companyId={companyId} stops={data.stops} regionOptions={regionOptions}/>;
}
