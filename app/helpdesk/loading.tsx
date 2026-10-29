export default function HelpdeskLoading(){
 return <div className="hd-loading" aria-busy="true" aria-label="Memuat data Helpdesk">
  <p role="status">Memuat data Helpdesk…</p>
  <div className="hd-loading-stats" aria-hidden="true">{Array.from({length:4},(_,index)=><span key={index}/>)}</div>
  <div className="hd-loading-panels" aria-hidden="true"><span/><span/></div>
 </div>;
}
