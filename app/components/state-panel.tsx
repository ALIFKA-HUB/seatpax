import type {ReactNode} from 'react';
export default function StatePanel({title,children,action,tone='neutral'}:{title:string;children?:ReactNode;action?:ReactNode;tone?:'neutral'|'danger'}) {
 return <section className={`sp-state sp-state-${tone}`}><h2>{title}</h2>{children&&<div className="sp-muted">{children}</div>}{action&&<div className="sp-actions">{action}</div>}</section>;
}
