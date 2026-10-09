import './crew.css';
import {crewData} from './data';
import CrewShell from './components/crew-shell';
export default async function Layout({children}:{children:React.ReactNode}) {
 await crewData();
 return <CrewShell>{children}</CrewShell>;
}
