import type {BadgeTone} from '../presentation';
export default function StatusBadge({label,tone}:{label:string;tone:BadgeTone}) {
 return <span className={`sp-badge sp-badge-${tone}`}>{label}</span>;
}
